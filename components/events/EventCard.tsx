"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Calendar, Clock, MapPin, Video, Users, Bell, BellOff } from "lucide-react";
import { type CCEvent, eventsApi } from "@/lib/api/events.api";
import { EventBadge } from "./EventBadge";
import { Button } from "@/components/ui/Button";
import { formatCount } from "@/lib/utils";
import { getErrorMessage } from "@/lib/api/client";
import toast from "react-hot-toast";

type EventCardProps = {
  event:    CCEvent;
  onUpdate?: (event: CCEvent) => void;
};

export function EventCard({ event, onUpdate }: EventCardProps) {
  var [rsvping,      setRsvping]      = useState(false);
  var [reminding,    setReminding]    = useState(false);
  var [hasRsvped,    setHasRsvped]    = useState(event.hasRsvped);
  var [rsvpCount,    setRsvpCount]    = useState(event.rsvpCount);
  var [reminderSet,  setReminderSet]  = useState(event.reminderSet);

  var startDate = new Date(event.startDate);
  var endDate   = new Date(event.endDate);
  var isPast    = event.status === "past";
  var isLive    = event.status === "live";
  var isFull    = event.maxAttendees ? rsvpCount >= event.maxAttendees : false;

  var dateStr  = startDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  var timeStr  = startDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) +
                 " \u2013 " +
                 endDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  async function handleRsvp() {
    if (rsvping || isPast) return;
    setRsvping(true);
    try {
      if (hasRsvped) {
        var r = await eventsApi.cancelRsvp(event._id);
        setHasRsvped(false);
        setRsvpCount(r.data.data.rsvpCount);
        toast("RSVP cancelled");
      } else {
        var r2 = await eventsApi.rsvp(event._id);
        setHasRsvped(true);
        setRsvpCount(r2.data.data.rsvpCount);
        toast.success("You are going!");
        if (onUpdate) onUpdate(Object.assign({}, event, { hasRsvped: true, rsvpCount: r2.data.data.rsvpCount }));
      }
    } catch(err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRsvping(false);
    }
  }

  async function handleReminder() {
    if (reminding || isPast) return;
    setReminding(true);
    try {
      if (reminderSet) {
        await eventsApi.removeReminder(event._id);
        setReminderSet(false);
        toast("Reminder removed");
      } else {
        await eventsApi.setReminder(event._id);
        setReminderSet(true);
        toast.success("Reminder set!");
      }
    } catch(err) {
      toast.error(getErrorMessage(err));
    } finally {
      setReminding(false);
    }
  }

  return React.createElement(
    "div",
    { className: "card p-5 flex flex-col gap-3 hover:border-surface-300 transition-all duration-150" + (isPast ? " opacity-70" : "") },

    /* Badges row */
    React.createElement(
      "div",
      { className: "flex items-center justify-between gap-2" },
      React.createElement(EventBadge, { type: event.type, status: event.status, size: "sm" }),
      React.createElement(
        "div",
        { className: "flex items-center gap-1" },
        isLive && React.createElement(
          "span",
          { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-danger-50 text-danger-600 border border-danger-200" },
          React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-danger-500 animate-pulse" }),
          "Live"
        ),
        !isPast && React.createElement(
          "button",
          {
            onClick: handleReminder,
            disabled: reminding,
            title: reminderSet ? "Remove reminder" : "Set reminder",
            className: "w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-100 transition-colors " + (reminderSet ? "text-amber-500" : "text-surface-400")
          },
          reminderSet
            ? React.createElement(Bell,    { size: 14 })
            : React.createElement(BellOff, { size: 14 })
        )
      )
    ),

    /* Title + description */
    React.createElement(
      Link,
      { href: "/events/" + event._id, className: "block group" },
      React.createElement("h3", { className: "text-base font-bold text-surface-900 group-hover:text-brand-700 transition-colors mb-1 leading-snug" }, event.title),
      React.createElement("p", { className: "text-sm text-surface-500 line-clamp-2 leading-relaxed" }, event.details)
    ),

    /* Meta */
    React.createElement(
      "div",
      { className: "space-y-1.5" },
      React.createElement(
        "div",
        { className: "flex items-center gap-2 text-xs text-surface-500" },
        React.createElement(Calendar, { size: 12, className: "text-surface-400 shrink-0" }),
        dateStr
      ),
      React.createElement(
        "div",
        { className: "flex items-center gap-2 text-xs text-surface-500" },
        React.createElement(Clock, { size: 12, className: "text-surface-400 shrink-0" }),
        timeStr
      ),
      event.location && React.createElement(
        "div",
        { className: "flex items-center gap-2 text-xs text-surface-500" },
        React.createElement(MapPin, { size: 12, className: "text-surface-400 shrink-0" }),
        React.createElement("span", { className: "truncate" }, event.location)
      ),
      !event.location && event.meetingUrl && React.createElement(
        "div",
        { className: "flex items-center gap-2 text-xs text-surface-500" },
        React.createElement(Video, { size: 12, className: "text-surface-400 shrink-0" }),
        "Online event"
      )
    ),

    /* Footer */
    React.createElement(
      "div",
      { className: "flex items-center justify-between pt-3 border-t border-surface-100" },
      React.createElement(
        "div",
        { className: "flex items-center gap-1.5 text-xs text-surface-500" },
        React.createElement(Users, { size: 12, className: "text-surface-400" }),
        formatCount(rsvpCount) + (event.maxAttendees ? " / " + formatCount(event.maxAttendees) : "") + " attending"
      ),
      !isPast && React.createElement(
        Button,
        {
          size:     "sm",
          variant:  hasRsvped ? "secondary" : "primary",
          loading:  rsvping,
          disabled: !hasRsvped && isFull,
          onClick:  handleRsvp
        },
        hasRsvped ? "Cancel RSVP" : isFull ? "Full" : "RSVP"
      )
    )
  );
}
