// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DocumentModel;
using Amazon.DynamoDBv2.Model;
using Amazon.Lambda.Core;
using ManagementConsoleBackend.Common;
using ManagementConsoleBackend.ManagementService.Data;
using ManagementConsoleBackend.ManagementService.Lib;
using Newtonsoft.Json;

namespace ManagementConsoleBackend.ManagementService
{
    public class EventHandlers
    {
        /// <summary>Handles custom EventBridge state events generated by the Step Functions poller</summary>
        public async Task StateEventHandler(Stream stream, ILambdaContext context)
        {
            var eventStr = ReadEventStream(stream);
            
            LambdaLogger.Log(eventStr);
            var stateEvent = JsonConvert.DeserializeObject<GameLiftStateEvent>(eventStr);
            LambdaLogger.Log(JsonConvert.SerializeObject(stateEvent, Formatting.Indented, new JsonSerializerSettings
            {
                NullValueHandling = NullValueHandling.Ignore
            }));

            var serverMessage = new ServerMessageGetState
            {
                State = stateEvent?.Detail
            };

            await ManagementService.SendToActiveConnections(serverMessage);
        }
        
        /// <summary>Handles GameLift Queue placement events and stores them in DDB</summary>
        public async Task QueuePlacementEventHandler(Stream stream, ILambdaContext context)
        {
            var dynamoDbClient = new AmazonDynamoDBClient();
            var eventStr = ReadEventStream(stream);

            LambdaLogger.Log(eventStr);
            var queuePlacementEvent = JsonConvert.DeserializeObject<QueuePlacementEvent>(eventStr);
            LambdaLogger.Log(JsonConvert.SerializeObject(queuePlacementEvent, Formatting.Indented,
                new JsonSerializerSettings
                {
                    NullValueHandling = NullValueHandling.Ignore
                }));

            var eventLogTable =
                Table.LoadTable(dynamoDbClient, Environment.GetEnvironmentVariable("EventLogTableName"));

            LambdaLogger.Log(queuePlacementEvent.Time.DateTime.ToString("yyyy-MM-ddTHH:mm:ss"));
            
            try
            {
                var item = Document.FromJson(eventStr);
                item["date"] = queuePlacementEvent.Time.DateTime.ToString("yyyy-MM-dd");
                item["time-id"] = queuePlacementEvent.Time.DateTime.ToString("yyyy-MM-ddTHH:mm:ss") + "-" + queuePlacementEvent.Id;
                item["placementId"] = queuePlacementEvent.Detail.PlacementId;
                item["TimeToLive"] = (Utils.GetUnixTimestamp() + (86400 * 7));
                await eventLogTable.PutItemAsync(item);
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.Message);
            }

            await this.HandleQueueEvent(queuePlacementEvent);
        }
        
        private async Task<bool> HandleQueueEvent(QueuePlacementEvent queuePlacementEvent)
        {
            // TODO - improve batch up event handling
            await ManagementService.SendToActiveConnections(new ServerMessageQueuePlacementEvent
            {
                QueuePlacementEventDetail = queuePlacementEvent.Detail,
                Resources = queuePlacementEvent.Resources
            });

            return true;
        }

        /// <summary>Handles FlexMatch events and stores them in DDB</summary>
        public async Task FlexMatchEventHandler(Stream stream, ILambdaContext context)
        {
            var dynamoDbClient = new AmazonDynamoDBClient();
            var eventStr = ReadEventStream(stream);

            var dynamoDbRequestHandler = new DynamoDbRequestHandler(dynamoDbClient);
            var configDocument = await dynamoDbRequestHandler.GetManagementConfig("mainConfig");

            LambdaLogger.Log(eventStr);
            var flexMatchEvent = JsonConvert.DeserializeObject<FlexMatchEvent>(eventStr);
            
            LambdaLogger.Log(JsonConvert.SerializeObject(flexMatchEvent, Formatting.Indented, new JsonSerializerSettings
            {
                NullValueHandling = NullValueHandling.Ignore
            }));
            
            await StoreFlexMatchEvent(eventStr, flexMatchEvent);
            
            // handle FlexMatch Simulator events
            if (flexMatchEvent.Resources[0] == configDocument.FlexMatchSimulatorArn)
            {
                LambdaLogger.Log("RECEIVED FLEXMATCH SIMULATOR EVENT!");
                await HandleSimulatorFlexMatchEvent(flexMatchEvent);
                LambdaLogger.Log("FINISHED PROCESSING FLEXMATCH SIMULATOR EVENT!");
            }
            else
            {
                LambdaLogger.Log("RECEIVED FLEXMATCH EVENT!");
                await HandleFlexMatchEvent(flexMatchEvent);
                LambdaLogger.Log("FINISHED PROCESSING FLEXMATCH EVENT!");
            }
        }

        private async Task<bool> HandleFlexMatchEvent(FlexMatchEvent flexMatchEvent)
        {
            // TODO - improve batch up event handling
            await ManagementService.SendToActiveConnections(new ServerMessageFlexMatchEvent
            {
                FlexMatchEventDetail = flexMatchEvent.Detail,
                Resources = flexMatchEvent.Resources
            });

            return true;
        }

        
        private async Task<bool> HandleSimulatorFlexMatchEvent(FlexMatchEvent flexMatchEvent)
        {
            var dynamoDbClient = new AmazonDynamoDBClient();

            var updateRequest = new UpdateItemRequest
            {
                TableName = Environment.GetEnvironmentVariable("MatchmakingSimulationTableName"),
                Key = new Dictionary<string, AttributeValue>()
                    {{"SimulationId", new AttributeValue {S = flexMatchEvent.Detail.CustomEventData}}},
                UpdateExpression = "SET #eventType = #eventType + :incr",
                ExpressionAttributeNames = new Dictionary<string, string>
                {
                },
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>()
                {
                    {":incr", new AttributeValue {N = "1"}},
                }
            };
            
            switch (flexMatchEvent.Detail.Type)
            {
                case "PotentialMatchCreated":
                    updateRequest.ExpressionAttributeNames.Add("#eventType", "PotentialMatchCreatedEvents");
                    break;
                
                case "MatchmakingSearching":
                    updateRequest.ExpressionAttributeNames.Add("#eventType", "MatchmakingSearchingEvents");
                    break; 
                
                case "MatchmakingTimedOut":
                    updateRequest.UpdateExpression += ", #matchesFailed = #matchesFailed + :incr, #playersFailed = #playersFailed + :playersFailed";
                    updateRequest.ExpressionAttributeNames.Add("#eventType", "MatchmakingTimedOutEvents");
                    updateRequest.ExpressionAttributeNames.Add("#playersFailed", "PlayersFailed");
                    updateRequest.ExpressionAttributeNames.Add("#matchesFailed", "MatchesFailed");
                    updateRequest.ExpressionAttributeValues.Add(":playersFailed", new AttributeValue {N = flexMatchEvent.Detail.GameSessionInfo.Players.Count.ToString() });
                    break; 

                case "MatchmakingFailed":
                    updateRequest.UpdateExpression += ", #matchesFailed = #matchesFailed + :incr, #playersFailed = #playersFailed + :playersFailed";
                    updateRequest.ExpressionAttributeNames.Add("#eventType", "MatchmakingFailedEvents");
                    updateRequest.ExpressionAttributeNames.Add("#playersFailed", "PlayersFailed");
                    updateRequest.ExpressionAttributeValues.Add(":playersFailed", new AttributeValue {N = flexMatchEvent.Detail.GameSessionInfo.Players.Count.ToString() });
                    updateRequest.ExpressionAttributeNames.Add("#matchesFailed", "MatchesFailed");
                    break; 
                
                case "MatchmakingCancelled":
                    updateRequest.UpdateExpression += ", #matchesFailed = #matchesFailed + :incr, #playersFailed = #playersFailed + :playersFailed";
                    updateRequest.ExpressionAttributeNames.Add("#eventType", "MatchmakingCancelledEvents");
                    updateRequest.ExpressionAttributeNames.Add("#playersFailed", "PlayersFailed");
                    updateRequest.ExpressionAttributeNames.Add("#matchesFailed", "MatchesFailed");
                    updateRequest.ExpressionAttributeValues.Add(":playersFailed", new AttributeValue {N = flexMatchEvent.Detail.GameSessionInfo.Players.Count.ToString() });
                    break; 
                
                case "MatchmakingSucceeded":
                    updateRequest.UpdateExpression += ", #matchesMade = #matchesMade + :incr, #playersMatched = #playersMatched + :playersMatched";
                    updateRequest.ExpressionAttributeNames.Add("#eventType", "MatchmakingSucceededEvents");
                    updateRequest.ExpressionAttributeNames.Add("#playersMatched", "PlayersMatched");
                    updateRequest.ExpressionAttributeNames.Add("#matchesMade", "MatchesMade");
                    updateRequest.ExpressionAttributeValues.Add(":playersMatched", new AttributeValue {N = flexMatchEvent.Detail.GameSessionInfo.Players.Count.ToString() });
                    break;                    
            }
            
            try
            {
                await dynamoDbClient.UpdateItemAsync(updateRequest);
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.Message);
            }

            await StoreSimulationResult(flexMatchEvent);
            
            return true;

        }
        
        private async Task<bool> StoreSimulationResult(FlexMatchEvent flexMatchEvent)
        {
            var dynamoDbClient = new AmazonDynamoDBClient();
            var dynamoDbRequestHandler = new DynamoDbRequestHandler(dynamoDbClient);
            
            var simulationResultsTable =
                Table.LoadTable(dynamoDbClient, Environment.GetEnvironmentVariable("SimulationResultsTableName"));

            var result = new MatchResultData();
            if (flexMatchEvent.Detail.Type == "PotentialMatchCreated")
            {
                result.SimulationId = flexMatchEvent.Detail.CustomEventData;
                result.MatchId = flexMatchEvent.Detail.MatchId;
                result.RuleEvaluationMetrics = flexMatchEvent.Detail.RuleEvaluationMetrics;
                result.Date = flexMatchEvent.Time.ToString("s")+"Z";
                if (flexMatchEvent.Detail.GameSessionInfo != null)
                {
                    result.NumPlayers = flexMatchEvent.Detail.GameSessionInfo.Players.Count;
                    result.Players = new List<MatchmakingSimulationPlayer>();

                    foreach (var player in flexMatchEvent.Detail.GameSessionInfo.Players)
                    {
                        LambdaLogger.Log("TRYING TO GET PLAYER " + player.PlayerId);
                        var playerData = await dynamoDbRequestHandler.GetDatabaseSimulationPlayer(result.SimulationId, player.PlayerId);
                        playerData.MatchedTeam = player.Team;
                        LambdaLogger.Log(JsonConvert.SerializeObject(playerData));
                        result.Players.Add(playerData);
                    }
                }
            }
            else
            {
                return false;
            }
            
            try
            {
                var item = Document.FromJson(JsonConvert.SerializeObject(result));
                await simulationResultsTable.PutItemAsync(item);
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.Message);
            }
            
            return true;
        }

        private async Task<bool> StoreFlexMatchEvent(string eventStr, FlexMatchEvent flexMatchEvent)
        {
            var dynamoDbClient = new AmazonDynamoDBClient();
            var timeToLive = (Utils.GetUnixTimestamp() + (86400 * 7));
            
            foreach (var ticket in flexMatchEvent.Detail.Tickets)
            {
                // add event id to ticket log table
                var updateRequest = new UpdateItemRequest
                {
                    TableName = Environment.GetEnvironmentVariable("TicketLogTableName"),
                    Key = new Dictionary<string, AttributeValue>() {{"TicketId", new AttributeValue {S = ticket.TicketId}}},
                    UpdateExpression = "ADD #events :eventId SET #time = :startTime, #matchmakingConfigArn = :matchmakingConfigArn, #timeToLive = :timeToLive",
                    ExpressionAttributeNames = new Dictionary<string, string>
                    {
                        {"#events", "events"},
                        {"#time", "time"},
                        {"#matchmakingConfigArn", "matchmakingConfigArn"},
                        {"#timeToLive", "TimeToLive"},
                        
                    },
                    ExpressionAttributeValues = new Dictionary<string, AttributeValue>()
                    {
                        {":eventId",new AttributeValue { SS = {flexMatchEvent.Id.ToString()}}},
                        {":startTime",new AttributeValue { S = ticket.StartTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }},
                        {":matchmakingConfigArn",new AttributeValue { S = flexMatchEvent.Resources[0] }},
                        {":timeToLive", new AttributeValue { N = timeToLive.ToString() }},
                    },
                };

                switch (flexMatchEvent.Detail.Type)
                {
                    case "MatchmakingTimedOut":
                    case "MatchmakingFailed":
                    case "MatchmakingCancelled":
                    case "MatchmakingSucceeded":
                        updateRequest.UpdateExpression =
                            "ADD #events :eventId SET #time = :startTime, #lastEventType = :eventType, #matchmakingConfigArn = :matchmakingConfigArn, #timeToLive = :timeToLive";
                        updateRequest.ExpressionAttributeNames.Add("#lastEventType", "lastEventType");
                        updateRequest.ExpressionAttributeValues.Add(":eventType", new AttributeValue { S = flexMatchEvent.Detail.Type });
                        
                        // add matchId if set
                        if (flexMatchEvent.Detail.MatchId != null)
                        {
                            updateRequest.UpdateExpression += ", #matchId = :matchId";
                            updateRequest.ExpressionAttributeNames.Add("#matchId", "matchId");
                            updateRequest.ExpressionAttributeValues.Add(":matchId",new AttributeValue { S = flexMatchEvent.Detail.MatchId });
                        }
                        break;                    
                }
                
                if (!String.IsNullOrEmpty(flexMatchEvent.Detail.CustomEventData))
                {
                    updateRequest.UpdateExpression += ", #customEventData = :customEventData";
                    updateRequest.ExpressionAttributeNames.Add("#customEventData", "customEventData");
                    updateRequest.ExpressionAttributeValues.Add(":customEventData", new AttributeValue { S = flexMatchEvent.Detail.CustomEventData });
                }

                try
                {
                    await dynamoDbClient.UpdateItemAsync(updateRequest);
                }
                catch (Exception e)
                {
                    LambdaLogger.Log(e.Message);
                }
            }
            
            // add event to eventlog table
            var eventLogTable =
                Table.LoadTable(dynamoDbClient, Environment.GetEnvironmentVariable("EventLogTableName"));
            
            try
            {
                var item = Document.FromJson(eventStr);
                item["date"] = flexMatchEvent.Time.DateTime.ToString("yyyy-MM-dd");
                item["time-id"] = flexMatchEvent.Time.DateTime.ToString("s")+"Z" + "-" + flexMatchEvent.Id;
                item["TimeToLive"] = timeToLive;
                LambdaLogger.Log("SAVING:" + JsonConvert.SerializeObject(item));
                await eventLogTable.PutItemAsync(item);
                LambdaLogger.Log("SAVED!");
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.Message);
            }
            return true;
        }

        private string ReadEventStream(Stream stream)
        {
            string eventStr;
            using (StreamReader reader = new StreamReader(stream))
            {
                eventStr = reader.ReadToEnd();
            }

            return eventStr;
        }

    }

}