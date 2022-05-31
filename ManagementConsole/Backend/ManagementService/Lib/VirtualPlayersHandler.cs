// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Amazon.ECS;
using Amazon.ECS.Model;
using Amazon.Lambda.Core;
using Newtonsoft.Json;

namespace ManagementConsoleBackend.ManagementService.Lib
{
    public class VirtualPlayersHandler
    {
        private AmazonECSClient _client;
        public VirtualPlayersHandler(AmazonECSClient client)
        {
            _client = client;
        }
        
        // Launches a number of virtual players via Fargate
        public async Task<bool> LaunchPlayers(int numPlayers, string taskDefinitionArn)
        {
            var maxTasksPerRequest = 10;
            var remainingPlayersToLaunch = numPlayers;
            var playersToLaunch = remainingPlayersToLaunch;
            
            var responses = new List<RunTaskResponse>();
            try
            {
                do
                {
                    playersToLaunch = remainingPlayersToLaunch;
                    
                    if (playersToLaunch > maxTasksPerRequest)
                    {
                        playersToLaunch = maxTasksPerRequest;
                    }

                    remainingPlayersToLaunch -= playersToLaunch;
                    
                    var request = new RunTaskRequest
                    {
                        Cluster = Environment.GetEnvironmentVariable("VirtualPlayersClusterArn"),
                        TaskDefinition = taskDefinitionArn,
                        LaunchType = LaunchType.FARGATE,
                        Count = playersToLaunch,
                        NetworkConfiguration = new Amazon.ECS.Model.NetworkConfiguration
                        {
                            AwsvpcConfiguration = new Amazon.ECS.Model.AwsVpcConfiguration
                            {
                                AssignPublicIp = AssignPublicIp.DISABLED,
                                Subnets = JsonConvert.DeserializeObject<List<string>>(
                                    Environment.GetEnvironmentVariable("VirtualPlayersSubnetIds")),
                                SecurityGroups = new [] { Environment.GetEnvironmentVariable("VirtualPlayersSecurityGroupId") }.ToList()
                            }
                        },
                    };

                    LambdaLogger.Log(JsonConvert.SerializeObject(request));
                    var response = await _client.RunTaskAsync(request);
                    LambdaLogger.Log(JsonConvert.SerializeObject(response));
                    
                } while (remainingPlayersToLaunch > 0);

                return true;
                
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
                return false;
            }
        }

        public async Task<List<Amazon.ECS.Model.TaskDefinition>> GetTaskDefinitions()
        {
            var taskDefinitionArns = new List<string>();
            var taskDefinitions = new List<TaskDefinition>();
            
            try
            {
                var listTaskDefinitionsPaginator =  _client.Paginators.ListTaskDefinitions(new ListTaskDefinitionsRequest());
                
                await foreach (var taskDefinitionArn in listTaskDefinitionsPaginator.TaskDefinitionArns)
                {
                    taskDefinitionArns.Add(taskDefinitionArn);    
                    var describeTaskDefinitionsResponse = await _client.DescribeTaskDefinitionAsync(
                        new DescribeTaskDefinitionRequest
                        {
                            TaskDefinition = taskDefinitionArn
                        });
                    
                    taskDefinitions.Add(describeTaskDefinitionsResponse.TaskDefinition);
                }
                
                return taskDefinitions;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
                return null;
            }
        }
        
        public async Task<List<Amazon.ECS.Model.Task>> GetVirtualPlayers()
        {
            var taskArns = new List<string>();
            var tasks = new List<Amazon.ECS.Model.Task>();
            try
            {
                var request = new ListTasksRequest()
                {
                    Cluster = Environment.GetEnvironmentVariable("VirtualPlayersClusterArn"),
                };
                
                LambdaLogger.Log(JsonConvert.SerializeObject(request));
                
                var listTasksPaginator = _client.Paginators.ListTasks(request);
                
                await foreach (var taskArn in listTasksPaginator.TaskArns)
                {
                    taskArns.Add(taskArn);
                }
                
                var maxTasksPerRequest = 100;

                for (var i = 0; i < taskArns.Count; i += maxTasksPerRequest)
                {
                    List<string> items = taskArns.GetRange(i, Math.Min(maxTasksPerRequest, taskArns.Count - i));
                    var describeTasksResponse = await _client.DescribeTasksAsync(
                        new DescribeTasksRequest
                        {
                            Tasks = items,
                            Cluster = Environment.GetEnvironmentVariable("VirtualPlayersClusterArn")
                        });

                    tasks = tasks.Concat(describeTasksResponse.Tasks).ToList();
                }

                return tasks;
            }
            catch (Exception e)
            {
                LambdaLogger.Log(e.ToString());
                return null;
            }
        }

        public async Task<List<string>> TerminateAllVirtualPlayers()
        {
            var errors = new List<string>();
            try
            {
                var request = new ListTasksRequest()
                {
                    Cluster = Environment.GetEnvironmentVariable("VirtualPlayersClusterArn"),
                };
                
                var listTasksPaginator = _client.Paginators.ListTasks(request);
                
                await foreach (var taskArn in listTasksPaginator.TaskArns)
                {
                    try
                    {
                        await TerminateVirtualPlayer(taskArn);
                    }
                    catch (Exception e)
                    {
                        errors.Add(e.Message);
                    }
                }
            }
            catch (Exception e)
            {
                errors.Add(e.Message);
            }

            return errors;
        }
        
        public async Task<List<string>> TerminateVirtualPlayer(string TaskArn)
        {
            var errors = new List<string>();
            try
            {
                var result = await _client.StopTaskAsync(new StopTaskRequest
                {
                    Cluster = Environment.GetEnvironmentVariable("VirtualPlayersClusterArn"),
                    Task = TaskArn
                });
            }
            catch (Exception e)
            {
                errors.Add(e.Message);
            }

            return errors;
        }

    }
}