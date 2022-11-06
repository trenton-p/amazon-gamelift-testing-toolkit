// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export class Events
{
    public static SCENE_CLICKED:string = "SceneClicked";
    public static SOCKET_MESSAGE:string = "SocketMessage";
    public static OPEN_SETTINGS:string = "OpenSettings";
    public static CLOSE_SETTINGS:string = "CloseSettings";
    public static ENABLE_ANIMATIONS:string = "EnableAnimations";
    public static DISABLE_ANIMATIONS:string = "DisableAnimations";
    public static LAUNCH_PLAYERS:string = "LaunchPlayers";
    public static ADJUST_FLEET_SCALING_RESPONSE:string = "AdjustFleetScalingResponse";
    public static SET_SCALING_POLICY_RESPONSE:string = "SetScalingPolicyResponse";
    public static DELETE_SCALING_POLICY_RESPONSE:string = "DeleteScalingPolicyResponse";
    public static UPDATE_FLEET_LOCATIONS_RESPONSE:string = "UpdateFleetLocationsResponse";
    public static GET_GAME_SESSIONS_RESPONSE:string = "GetGameSessionsResponse";
    public static GET_GAME_SESSION_LOGS_RESPONSE:string = "GetGameSessionLogsResponse";
    public static GET_QUEUE_EVENTS_RESPONSE:string = "GetQueueEventsResponse";
    public static GET_QUEUE_EVENT_BY_PLACEMENT_ID_RESPONSE:string = "GetQueueEventByPlacementIdResponse";
    public static GET_TASK_DEFINITIONS_RESPONSE:string = "GetTaskDefinitionsResponse";
    public static GET_MATCHMAKING_TICKET_HEADERS_RESPONSE:string = "GetMatchmakingTicketHeadersResponse";
    public static GET_MATCHMAKING_TICKET_HEADERS_BY_MATCH_ID_RESPONSE:string = "GetMatchmakingTicketHeadersByMatchId";
    public static GET_MATCHMAKING_TICKET_HEADERS_BY_SIMULATION_ID_RESPONSE:string = "GetMatchmakingTicketHeadersBySimulationId";
    public static GET_MATCHMAKING_TICKET_RESPONSE:string = "GetMatchmakingTicketResponse";
    public static GET_CLOUDWATCH_GRAPH_RESPONSE:string = "GetCloudWatchGraphResponse";
    public static CREATE_MATCHMAKING_RULESET_RESPONSE:string = "CreateMatchmakingRuleSetResponse";
    public static DELETE_MATCHMAKING_RULESET_RESPONSE:string = "DeleteMatchmakingRuleSetResponse";
    public static VALIDATE_MATCHMAKING_RULESET_RESPONSE:string = "ValidateMatchmakingRuleSetResponse";
    public static UPDATE_MATCHMAKING_CONFIGURATION_RESPONSE:string = "UpdateMatchmakingConfigurationResponse";
    public static GET_FLEET_SCALING_RESPONSE:string = "GetFleetScalingResponse";
    public static GET_MATCHMAKING_RULESETS_RESPONSE:string = "GetMatchmakingRuleSetsResponse";
    public static GET_MATCHMAKING_SIMULATIONS_RESPONSE:string = "GetMatchmakingSimulationsResponse";
    public static GET_MATCHMAKING_SIMULATION_RESPONSE:string = "GetMatchmakingSimulationResponse";
    public static GET_SIMULATION_MATCHES_RESPONSE:string = "GetSimulationSuccessfulMatchesResponse";
    public static RUN_MATCHMAKING_SIMULATION_RESPONSE:string = "RunMatchmakingSimulationResponse";
    public static MATCHMAKING_SIMULATION_UPDATE:string = "MatchmakingSimulationUpdate";
    public static GET_PLAYER_PROFILES_RESPONSE:string = "GetPlayerProfilesResponse";
    public static SAVE_PLAYER_PROFILE_RESPONSE:string = "SavePlayerProfileResponse";
    public static DELETE_PLAYER_PROFILE_RESPONSE:string = "DeletePlayerProfileResponse";
    public static GET_LATENCY_PROFILES_RESPONSE:string = "GetLatencyProfilesResponse";
    public static SAVE_LATENCY_PROFILE_RESPONSE:string = "SaveLatencyProfileResponse";
    public static DELETE_LATENCY_PROFILE_RESPONSE:string = "DeleteLatencyProfileResponse";
    public static GET_PLAYER_SESSIONS_RESPONSE:string = "GetPlayerSessionsResponse";
    public static GET_VIRTUAL_PLAYERS_RESPONSE:string = "GetVirtualPlayersResponse";
    public static LAUNCH_VIRTUAL_PLAYERS_RESPONSE:string = "LaunchVirtualPlayersResponse";
    public static TERMINATE_VIRTUAL_PLAYER_RESPONSE:string = "TerminateVirtualPlayerResponse";
    public static ADD_FAKE_FLEET:string = "AddFakeFleet";
    public static ADD_FAKE_PLAYER:string = "AddFakePlayer";
    public static ADD_BIG_PLAYER:string = "AddBigPlayer";
    public static ADD_FAKE_INSTANCE:string = "AddFakeInstance";
    public static ADD_FAKE_QUEUE:string = "AddFakeQueue";
    public static ADD_FAKE_ANIMATIONS:string = "AddFakeAnimations";
    public static ADD_FAKE_MATCH:string = "AddFakeMatch";
    public static ADD_FAKE_PLAYER_TO_MATCH:string = "AddFakePlayerToMatch";
    public static ADD_FAKE_GAME_SESSION:string = "AddFakeGameSession";
    public static ADD_FAKE_MATCHMAKING_CONFIG:string = "AddFakeMatchmakingConfig";
    public static CLOSE_POPUP:string = "ClosePopup";
    public static CLOSE_MENUS:string = "CloseMenus";
    public static SHOW_FLEET_POPUP:string = "ShowFleetPopup";
    public static SHOW_FLEET_GRAPH_POPUP:string = "ShowFleetGraphPopup";
    public static SHOW_FLEET_SCALING_POPUP:string = "ShowFleetScalingPopup";
    public static SHOW_FLEET_LOCATIONS_POPUP:string = "ShowFleetLocationsPopup";
    public static SHOW_MANAGE_VIRTUAL_PLAYERS_POPUP:string = "ShowManageVirtualPlayersPopup";
    public static SHOW_LAUNCH_VIRTUAL_PLAYERS_POPUP:string = "ShowLaunchVirtualPlayersPopup";
    public static SHOW_FLEET_EVENTS_POPUP:string = "ShowFleetEventsPopup";
    public static SHOW_GAME_SESSIONS_TABLE_POPUP:string = "ShowGameSessionsTablePopup";
    public static SHOW_GAME_SESSION_LOGS_POPUP:string = "ShowGameSessionLogsPopup";
    public static SHOW_QUEUE_EVENTS_POPUP:string = "ShowQueueEventsPopup";
    public static SHOW_FLEXMATCH_SIMULATOR_POPUP:string = "ShowFlexMatchSimulatorPopup";
    public static SHOW_MATCHMAKING_RULESETS_POPUP:string = "ShowMatchmakingRuleSetsPopup";
    public static SHOW_MATCHMAKING_TICKETS_POPUP:string = "ShowMatchmakingTicketsPopup";
    public static SHOW_MODIFY_MATCHMAKING_CONFIGURATION_POPUP:string = "ShowModifyMatchmakingConfigurationPopup";
    public static SHOW_PLAYER_POPUP:string = "ShowPlayerPopup";
    public static OVER_PLAYER:string = "OverPlayer";
    public static SHOW_QUEUE_POPUP:string = "ShowQueuePopup";
    public static SHOW_QUEUE_GRAPH_POPUP:string = "ShowQueueGraphPopup";
    public static SHOW_MATCHMAKING_CONFIG_POPUP:string = "ShowMatchmakingConfigPopup";
    public static SHOW_MATCHMAKING_GRAPH_POPUP:string = "ShowMatchmakingConfigGraphPopup";
    public static SHOW_MATCHMAKING_CONFIG_QUEUES:string = "ShowMatchmakingConfigQueues";
    public static HIDE_MATCHMAKING_CONFIG_QUEUES:string = "HideMatchmakingConfigQueues";
    public static SHOW_QUEUE_FLEETS:string = "ShowQueueFleets";
    public static HIDE_QUEUE_FLEETS:string = "HideQueueFleets";
    public static SHOW_INSTANCE_POPUP:string = "ShowInstancePopup";
    public static TOGGLE_FLEET_DISPLAY:string = "ToggleFleetDisplay";
    public static PLAYER_ADDED_TO_GAME_SESSION:string = "PlayerAddedToGameSession";
    public static CLICK:string = "Click";
    public static OVER:string = "Over";
    public static OUT:string = "Out";

}

