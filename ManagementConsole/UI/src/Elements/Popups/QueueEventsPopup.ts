// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'phaser';
import {DataTypes} from "../../Data/DataTypes";
import {Fleet} from "../Fleet";
import DOMElement = Phaser.GameObjects.DOMElement;
import {Network} from "../../Network/Network";
import {EventDispatcher} from "../../Events/EventDispatcher";
import {Events} from "../../Events/Events";
import Rectangle = Phaser.GameObjects.Rectangle;
import config from "../../Config/Config"
import {Popup} from "../Abstract/Popup";
import Instance = DataTypes.Instance;
import GameSession = DataTypes.GameSession;
import GameSessionQueue = DataTypes.GameSessionQueue;
import QueuePlacementEventDetail = DataTypes.QueuePlacementEventDetail;
import {Utils} from "../../Utils/Utils";
import JSONEditor, {JSONEditorOptions} from 'jsoneditor';

export class QueueEventsPopup extends Popup
{
    protected _queueEvents: QueuePlacementEventDetail[];
    protected _queue:GameSessionQueue;
    protected _ticketEvents: any[];

    constructor (scene:Phaser.Scene, x:number, y:number)
    {
        super(scene, x, y);
        this._htmlName="queueEventsPopup";
        this.setupEventListeners();
    }

    setPopupData(data:any)
    {
        this._queue = data.gameObject.Data as GameSessionQueue;
        this.refresh();
    }

    refresh()
    {
        Network.sendObject({Type:"GetQueueEvents", QueueArn:this._queue.GameSessionQueueArn});
    }

    resetTable()
    {
        let parser = new DOMParser();
        let element = parser.parseFromString(this._html, "text/html");

        this._popup.node.querySelector("#queueEventsTable_wrapper")?.remove();
        if (this._popup.node.querySelector("table#queueEventsTable")==null)
        {
            this._popup.node.querySelector(".queueEventsContent")?.appendChild(element.querySelector("#queueEventsTable"));
        }
    }

    resetTicketHeadersTable()
    {
        let parser = new DOMParser();
        let element = parser.parseFromString(this._html, "text/html");

        this._popup.node.querySelector("#matchmakingTicketHeadersTable_wrapper")?.remove();
        if (this._popup.node.querySelector("table#matchmakingTicketHeadersTable")==null)
        {
            this._popup.node.querySelector(".matchmakingTicketHeadersContent")?.appendChild(element.querySelector("#matchmakingTicketHeadersTable"));
        }
    }

    resetTicketEventJson()
    {
        this._popup.node.querySelector("#matchmakingTicketEventJson").innerHTML="";
    }

    resetTicketEventsTable()
    {
        console.log(this._html);
        //const original = new DOMElement(this.scene, 0, 0).createFromCache(this._htmlName);
        console.log(this._popup.node.querySelector("table#matchmakingTicketEventsTable").outerHTML);
        let parser = new DOMParser();
        let element = parser.parseFromString(this._html, "text/html");

        this._popup.node.querySelector("#matchmakingTicketEventsTable_wrapper")?.remove();
        if (this._popup.node.querySelector("table#matchmakingTicketEventsTableTable")==null)
        {
            this._popup.node.querySelector(".matchmakingTicketEventsContent")?.appendChild(element.querySelector("#matchmakingTicketEventsTable"));
        }
    }

    onGetMatchmakingTicketHeadersResponse = (data) =>
    {
        let html="";

        this.showMatchmakingTicketsList();
        this.hideQueueEventsList();

        data.TicketHeaders?.map(header =>
        {
            let viewEventsTd='<td><a class="viewTicket btn btn-primary btn-sm" id="' + header.TicketId +'" href="' + "#" + '">View Events</a></td>';
            let viewQueueEventsTd='<td><a class="viewQueueEvent btn btn-primary btn-sm" id="' + header.MatchId +'" href="' + "#" + '">View Queue Event</a></td>';

            if (header.MatchId==undefined)
            {
                viewQueueEventsTd='<td></td>';
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

        this.resetTicketHeadersTable();

        this._popup.node.querySelector("table#matchmakingTicketHeadersTable tbody").insertAdjacentHTML("beforeend", html);
        this.activateDataTable("matchmakingTicketHeadersTable");
    }

    onGetMatchmakingTicketResponse = (ticket) =>
    {
        console.log(ticket);
        let html="";

        this._ticketEvents = ticket.Ticket.Events;

        this._ticketEvents.map(ticketEvent => {
            let viewEventDetailTd='<td><a class="viewTicketEvent btn btn-primary btn-sm" id="' + ticketEvent.id +'" href="' + "#" + '">View Detail</a></td>';
            html += '<tr>' +
                '<td>' + ticketEvent.time + '</td>'+
                '<td>' + ticketEvent.detail.type + '</td>'+
                viewEventDetailTd +
                '</tr>'
        });

        console.log(html);

        this._popup.node.querySelector("table#matchmakingTicketEventsTable tbody").insertAdjacentHTML("beforeend", html);

        this.hideMatchmakingTicketsList();
        this.showMatchmakingTicketEventList();
        this.hideRefreshButton();
        this.activateDataTable("matchmakingTicketEventsTable");
    };

    setupEventListeners()
    {
        this._emitter.on(Events.GET_QUEUE_EVENTS_RESPONSE, this.onGetQueueEventsResponse);
        this._emitter.on(Events.GET_MATCHMAKING_TICKET_HEADERS_BY_MATCH_ID_RESPONSE, this.onGetMatchmakingTicketHeadersResponse);
        this._emitter.on(Events.GET_MATCHMAKING_TICKET_RESPONSE, this.onGetMatchmakingTicketResponse);
    }

    removeEventListeners()
    {
        this._emitter.off(Events.GET_QUEUE_EVENTS_RESPONSE, this.onGetQueueEventsResponse);
        this._emitter.off(Events.GET_MATCHMAKING_TICKET_HEADERS_BY_MATCH_ID_RESPONSE, this.onGetMatchmakingTicketHeadersResponse);
        this._emitter.off(Events.GET_MATCHMAKING_TICKET_RESPONSE, this.onGetMatchmakingTicketResponse);
    }

    onGetQueueEventsResponse = (data:QueuePlacementEventDetail[]) =>
    {
        this._queueEvents = data;

        let html="";
        data.map(queueEvent =>
        {
            let queueDetailLinkTd='<td><a class="viewDetail btn btn-primary btn-sm" id="' + queueEvent.placementId +'" href="' + "#" + '">View Detail</a></td>';
            let matchmakingTicketsTd='<td><a class="viewMatchmakingTickets btn btn-primary btn-sm" id="' + queueEvent.placementId +'" href="' + "#" + '">View Matchmaking Tickets</a></td>';
            let placementDuration = "-";
            if (queueEvent.startTime!=null && queueEvent.endTime>queueEvent.startTime)
            {
                let startTime = new Date(queueEvent.startTime);
                let endTime = new Date(queueEvent.endTime);
                let secondsDuration = Math.round((endTime.getTime() - startTime.getTime())/1000);
                placementDuration = Utils.secondsToDuration(secondsDuration);
            }

            html += '<tr>' +
                '<td>' + queueEvent.startTime + '</td>'+
                '<td>' + queueEvent.type + '</td>'+
                '<td>' + placementDuration + '</td>'+
                queueDetailLinkTd +
                matchmakingTicketsTd +
                '</tr>';
        });

        this.resetTable();

        this._popup.node.querySelector("table#queueEventsTable tbody").insertAdjacentHTML("beforeend", html);
        this.activateDataTable("queueEventsTable");
    }

    onPopupClick = async (event) => {

        event.stopPropagation();
        console.log(event.target);
        if (event.target.className == "refreshButton")
        {
            this.refresh();
        }
        else if (event.target.className == "closeButton")
        {
            this._emitter.emit(Events.CLOSE_POPUP);
            this.setVisible(false);
        }
        else if (event.target.id == "backToQueueEventList")
        {
            this.backToQueueEventList();
        }
        else if (event.target.id == "backToTicketList")
        {
            this.backToTicketList();
        }
        else if (event.target.id == "backToTicketEventList")
        {
            this.backToMatchmakingTicketEventList();
        }
        else if (event.target.className.indexOf("viewDetail") !== -1) {
            console.log(event.target.id);
            let queueEvent = this._queueEvents.filter(queueEvent => queueEvent.placementId == event.target.id)[0];
            this.showEventDetail(queueEvent);
            this.hideRefreshButton();
        }
        else if (event.target.className.indexOf("viewTicketEvent") !== -1)
        {
            console.log("VIEWING TICKET DETAIL!");
            console.log(event.target.id);
            let ticketEvent = this._ticketEvents.filter(ticketEvent => ticketEvent.id == event.target.id)[0];
            this.showTicketEventDetail(ticketEvent);
        }
        else if (event.target.className.indexOf("viewTicket") !== -1)
        {
            console.log("VIEWING TICKET!");
            Network.sendObject({Type:"GetMatchmakingTicket", TicketId:event.target.id});
        }
        else if (event.target.className.indexOf("viewMatchmakingTickets") !== -1)
        {
            console.log(event.target.id);
            Network.sendObject({Type:"GetMatchmakingTicketHeadersByMatchId", MatchId:event.target.id});
        }
    }

    showEventDetail = (queueEvent) =>
    {
        console.log(queueEvent);

        const container = document.getElementById("queueEventJson")
        const options:JSONEditorOptions = {mode:"view", name:"Queue Placement Event"}

        const editor = new JSONEditor(container, options);

        editor.set(queueEvent);

        this.hideQueueEventsList();
        this.showQueueEventJson();
    }

    showTicketEventDetail = (ticketEvent) =>
    {
        console.log(ticketEvent);

        const container = document.getElementById("matchmakingTicketEventJson")
        const options:JSONEditorOptions = {mode:"view", name:"FlexMatch Event"}

        const editor = new JSONEditor(container, options);
        editor.set(ticketEvent);
        editor.expandAll();

        this.hideMatchmakingTicketEventList();
        this.showMatchmakingTicketJson();
        this.hideRefreshButton();
    }

    showMatchmakingTicketJson()
    {
        this._popup.node.querySelector(".matchmakingTicketEventDetailContent").className="matchmakingTicketEventDetailContent";
    }

    hideMatchmakingTicketJson()
    {
        this._popup.node.querySelector(".matchmakingTicketEventDetailContent").className="matchmakingTicketEventDetailContent hide";
    }

    resetJson()
    {
        this._popup.node.querySelector("#queueEventJson").innerHTML="";
    }

    backToQueueEventList()
    {
        this.hideQueueEventJson();
        this.showQueueEventsList();
        this.hideMatchmakingTicketsList();
        this.showRefreshButton();
        this.resetJson();
    }

    backToTicketList()
    {
        this.hideQueueEventJson();
        this.hideQueueEventsList();
        this.showMatchmakingTicketsList();
        this.hideMatchmakingTicketEventList();
        this.resetTicketEventsTable();
        this.hideRefreshButton();
        this.resetJson();
    }

    backToMatchmakingTicketEventList()
    {
        this.showMatchmakingTicketEventList();
        this.hideMatchmakingTicketJson();
        this.hideQueueEventJson();
        this.resetJson();
        this.resetTicketEventJson();
    }

    showRefreshButton()
    {
        this._popup.node.querySelector(".refreshButton").className="refreshButton";
    }

    hideRefreshButton()
    {
        this._popup.node.querySelector(".refreshButton").className="refreshButton hide";
    }

    showQueueEventsList()
    {
        this._popup.node.querySelector(".queueEventsContent").className = "queueEventsContent";
    }

    hideQueueEventsList()
    {
        this._popup.node.querySelector(".queueEventsContent").className = "queueEventsContent hide";
    }

    showQueueEventJson()
    {
        this._popup.node.querySelector(".queueEventDetailContent").className = "queueEventDetailContent";
    }

    hideQueueEventJson()
    {
        this._popup.node.querySelector(".queueEventDetailContent").className = "queueEventDetailContent hide";
    }

    showMatchmakingTicketsList()
    {
        this._popup.node.querySelector(".matchmakingTicketHeadersContent").className="matchmakingTicketHeadersContent";
    }

    hideMatchmakingTicketsList()
    {
        this._popup.node.querySelector(".matchmakingTicketHeadersContent").className="matchmakingTicketHeadersContent hide";
    }

    showMatchmakingTicketEventList()
    {
        this._popup.node.querySelector(".matchmakingTicketEventsContent").className="matchmakingTicketEventsContent";
    }

    hideMatchmakingTicketEventList()
    {
        this._popup.node.querySelector(".matchmakingTicketEventsContent").className="matchmakingTicketEventsContent hide";
    }

    activateDataTable(id) {
        // @ts-ignore
        $('#'+id).DataTable({
            scrollY: "400px",
            scrollCollapse: true,
            columnDefs: [
                { width: 200, targets: 0 }
            ],
            order: [[ 0, "desc" ]]
        });
    }
}