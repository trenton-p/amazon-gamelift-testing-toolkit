// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {DataTypes} from "../../Data/DataTypes";
import {Network} from "../../Network/Network";
import {Events} from "../../Events/Events";
import JSONEditor, {JSONEditorOptions} from 'jsoneditor';
import MatchmakingRuleSet = DataTypes.MatchmakingRuleSet;
import {SubPopup} from "../Abstract/SubPopup";
import PlayerProfile = DataTypes.PlayerProfile;
import LatencyProfile = DataTypes.LatencyProfile;
import {PageManager} from "../Pages/PageManager";
import {Page} from "../Abstract/Page";
import {Pages} from "./Pages";

export class SimulateMatchmakingFailedTickets extends Page
{
    public static id = Pages.SIMULATE_MATCHMAKING_FAILED_TICKETS;
    public static url = "assets/html/fragments/simulateMatchmakingFailedTickets.html";
    protected _ticketEvents: any[];
    protected _currentSimulation;
    protected _ticketId: string;

    public constructor (parentPage:Page=null)
    {
        super( SimulateMatchmakingFailedTickets.url,  parentPage, SimulateMatchmakingFailedTickets.id);
    }

    public onPopupClick(event) {
        let el = $(event.target);

        if (el.hasClass("viewFailedMatchTicketEvent"))
        {
            console.log("VIEWING FAILED MATCH TICKET DETAIL!");
            console.log(event.target.id);
            let ticketEvent = this._ticketEvents.filter(ticketEvent => ticketEvent.id == event.target.id)[0];
            this.showFailedMatchTicketEventDetail(ticketEvent);
        }
        else
        if (el.attr("id")=="failedMatchTicketEventDetailBackButton") // back to event list
        {
            this.backToFailedMatchTicketEventList();
        }
        else
        if (el.attr("id")=="backToMatchResults")
        {
            this.goBack(this._currentSimulation);
        }
/*
        if (el.attr("id")=="backToSimulationOutput")
        {
            this.goBack(this._currentSimulation);
        }
        else
        if (el.hasClass("viewTicket"))
        {
            this.goBack(this._currentSimulation);
        }
        else
        if (el.attr("id") == "backButton")
        {
            this.backToMatchmakingTicketsList();
        }
        else
        if (el.attr("id") == "eventDetailBackButton") // back to event list
        {
            this.backToMatchmakingTicketEventList();
        }
        else
        if (el.hasClass("viewTicketEvent"))
        {
            console.log("VIEWING TICKET DETAIL!");
            console.log(event.target.id);
            let ticketEvent = this._ticketEvents.filter(ticketEvent => ticketEvent.id == el.attr("id"));
            this.showEventDetail(ticketEvent);
        }

 */
        /*
        if (el.attr("id")=="simulateMatchmakingButton") // show simulation form
        {
            PageManager.switchPage(Pages.SIMULATE_MATCHMAKING_FORM);
        }
        else
        if (el.hasClass("viewSimulationOutput"))
        {
            PageManager.switchPage(Pages.SIMULATE_MATCHMAKING_OUTPUT, {SimulationId: el.attr("id")});
        }*/
    }

    initPage() {
        Network.sendObject({Type:"GetMatchmakingTicket", TicketId:this._ticketId});
    }

    setPageData(data: any) {
        this._currentSimulation = data.currentSimulation;
        this._ticketId = data.ticketId;
    }

    setupEventListeners() {
        this._emitter.on(Events.GET_MATCHMAKING_TICKET_HEADERS_BY_SIMULATION_ID_RESPONSE, this.onGetMatchmakingTicketHeadersBySimulationIdResponse);
        this._emitter.on(Events.GET_MATCHMAKING_TICKET_RESPONSE, this.onGetMatchmakingTicketResponse);
    }

    removeEventListeners() {
        this._emitter.off(Events.GET_MATCHMAKING_TICKET_HEADERS_BY_SIMULATION_ID_RESPONSE, this.onGetMatchmakingTicketHeadersBySimulationIdResponse);
        this._emitter.off(Events.GET_MATCHMAKING_TICKET_RESPONSE, this.onGetMatchmakingTicketResponse);
    }

    onGetMatchmakingTicketHeadersBySimulationIdResponse = (data) =>
    {
        let html="";

//        this.showMatchmakingTicketsList();
//        this.hideSimulationOutput();

        let matchData = {successfulMatches:{}, failedMatches:[]};

        data.TicketHeaders?.map(header =>
        {
            let viewEventsTd='<td><a class="viewTicket btn btn-primary btn-sm" id="' + header.TicketId +'" href="' + "#" + '">View Events</a></td>';
            let viewQueueEventsTd='<td><a class="viewQueueEvent btn btn-primary btn-sm" id="' + header.MatchId +'" href="' + "#" + '">View Queue Event</a></td>';

            if (header.MatchId==undefined)
            {
                viewQueueEventsTd='<td></td>';
                matchData.failedMatches.push(header);
            }
            else
            {
                if (matchData.successfulMatches[header.MatchId]==undefined)
                {
                    matchData.successfulMatches[header.MatchId]={tickets:[], numPlayers:0};
                }

                if (header.LastEventType=="MatchmakingSucceeded")
                {
                    matchData.successfulMatches[header.MatchId].tickets.push(header);
                    matchData.successfulMatches[header.MatchId].numPlayers++;
                }
            }

            if (header.LastEventType==null)
            {
                header.LastEventType="-";
            }
            html += '<tr>' +
                '<td>' + header.Time + '</td>'+
                '<td>' + header.TicketId + '</td>'+
                '<td>' + header.LastEventType + '</td>'+
                '<td>' + header.Events.length + '</td>'+
                viewEventsTd +
                '</tr>';
        });

        console.log(matchData);

        this.resetTicketHeadersTable();

        $('#'+this._domId).find("table#matchmakingTicketHeadersTable tbody").html(html);
        this.activateDataTable("matchmakingTicketHeadersTable");
    }

    resetTicketHeadersTable()
    {
        this.resetElement(".matchmakingTicketHeadersContent");
    }

    onGetMatchmakingTicketResponse = (ticket) => {

        this._ticketEvents = ticket.Ticket.Events;

        let html="";
        this._ticketEvents.map(ticketEvent => {
            let viewEventDetailTd='<td><a class="viewFailedMatchTicketEvent btn btn-primary btn-sm" id="' + ticketEvent.id +'" href="' + "#" + '">View Detail</a></td>';
            html += '<tr>' +
                '<td>' + ticketEvent.time + '</td>'+
                '<td>' + ticketEvent.detail.type + '</td>'+
                viewEventDetailTd +
                '</tr>'
        });

        $('#'+this._domId).find("table#failedMatchmakingTicketEventsTable tbody").html(html);
        this.activateDataTable("failedMatchmakingTicketEventsTable");
    }

    resetEventsTable()
    {
        this.resetElement(".matchmakingTicketEventsContent");
    }


    hideMatchmakingTicketsList()
    {
        $('#'+this._domId).find(".matchmakingTicketHeadersContent").hide();
    }

    showMatchmakingTicketJson()
    {
        $('#'+this._domId).find(".matchmakingTicketEventDetailContent").show();
    }

    hideMatchmakingTicketJson()
    {
        $('#'+this._domId).find(".matchmakingTicketEventDetailContent").hide();
    }

    showMatchmakingTicketsList()
    {
        $('#'+this._domId).find(".matchmakingTicketHeadersContent").show();
    }

    showMatchmakingTicketEventList()
    {
        $('#'+this._domId).find(".matchmakingTicketEventsContent").show();
    }

    hideMatchmakingTicketEventList()
    {
        $('#'+this._domId).find(".matchmakingTicketEventsContent").hide();
    }

    backToMatchmakingTicketsList()
    {
        this.showMatchmakingTicketsList();
        this.hideMatchmakingTicketEventList();
        this.resetEventsTable();
    }

    backToMatchmakingTicketEventList()
    {
        this.showMatchmakingTicketEventList();
        this.hideMatchmakingTicketJson();
        this.resetJson();
    }

    resetJson()
    {
        $('#'+this._domId).find("#matchmakingTicketEventJson").html("");
    }

    showEventDetail = (ticketEvent) =>
    {
        console.log(ticketEvent);

        const container = document.getElementById("matchmakingTicketEventJson")
        const options:JSONEditorOptions = {mode:"view", name:"FlexMatch Event"}

        const editor = new JSONEditor(container, options);
        editor.set(ticketEvent);
        editor.expandAll();

        this.hideMatchmakingTicketEventList();
        this.showMatchmakingTicketJson();
    }

    showFailedMatchTicketJson()
    {
        $('#'+this._domId).find(".failedMatchTicketEventDetailContent").show();
    }

    hideFailedMatchTicketJson()
    {
        $('#'+this._domId).find(".failedMatchTicketEventDetailContent").hide();
    }

    showFailedMatchTicketEventDetail = (ticketEvent) =>
    {
        console.log("SHOW FAILED MATCH TICKET??");
        console.log(ticketEvent);

        const container = $('#'+this._domId).find("#failedMatchmakingTicketEventJson")[0];
        const options:JSONEditorOptions = {mode:"view", name:"FlexMatch Event"}

        const editor = new JSONEditor(container, options);
        editor.set(ticketEvent);
        editor.expandAll();

        this.hideFailedMatchTicketEventList();
        this.showFailedMatchTicketJson();
    }

    hideFailedMatchTicketEventList()
    {
        $('#'+this._domId).find(".failedMatchTicketEventsContent").hide();
    }

    backToFailedMatchTicketEventList()
    {
        this.showFailedMatchTicketEventList();
        this.hideFailedMatchTicketJson();
        this.resetFailedMatchJson();
    }

    showFailedMatchTicketEventList()
    {
        $('#'+this._domId).find(".failedMatchTicketEventsContent").show();
    }

    resetFailedMatchJson()
    {
        $('#'+this._domId).find("#failedMatchmakingTicketEventJson").html("");
    }

}