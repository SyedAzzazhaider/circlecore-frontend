"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Calendar, Loader2 } from "lucide-react";
import { eventsApi, type CCEvent, type EventFilter } from "@/lib/api/events.api";
import { EventCard } from "@/components/events/EventCard";
import { Button } from "@/components/ui/Button";
import { getErrorMessage } from "@/lib/api/client";

var FILTER_TABS: { id: EventFilter; label: string }[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "live",     label: "Live Now" },
  { id: "past",     label: "Past"     }
];

var TYPE_FILTERS = [
  { id: "all",     label: "All types" },
  { id: "webinar", label: "Webinars"  },
  { id: "meetup",  label: "Meetups"   },
  { id: "room",    label: "Rooms"     }
];

export default function EventsPage() {
  var [filter,     setFilter]     = useState<EventFilter>("upcoming");
  var [typeFilter, setTypeFilter] = useState("all");
  var [events,     setEvents]     = useState<CCEvent[]>([]);
  var [loading,    setLoading]    = useState(true);
  var [error,      setError]      = useState("");
  var [page,       setPage]       = useState(1);
  var [hasMore,    setHasMore]    = useState(false);

  var loadEvents = useCallback(function(
    f: EventFilter,
    t: string,
    p: number,
    replace: boolean
  ) {
    setLoading(true);
    setError("");
    eventsApi
      .getEvents(f, t, p)
      .then(function(res) {
        var data = res.data.data;
        if (replace) {
          setEvents(data.data);
        } else {
          setEvents(function(prev) { return [...prev, ...data.data]; });
        }
        setHasMore(p < data.totalPages);
        setPage(p);
      })
      .catch(function(err) { setError(getErrorMessage(err)); })
      .finally(function() { setLoading(false); });
  }, []);

  useEffect(function() {
    loadEvents(filter, typeFilter, 1, true);
  }, [filter, typeFilter, loadEvents]);

  function handleEventUpdate(updated: CCEvent) {
    setEvents(function(prev) {
      return prev.map(function(e) { return e._id === updated._id ? updated : e; });
    });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">

      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
          <Calendar size={18} className="text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-surface-900 leading-tight">Events</h1>
          <p className="text-sm text-surface-500">Webinars, meetups and private rooms from your communities.</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-4 bg-white border border-surface-200 rounded-xl p-1 shadow-card">
        {FILTER_TABS.map(function(tab) {
          var isActive = filter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={function() { setFilter(tab.id); }}
              className={[
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all duration-150",
                isActive ? "bg-brand-600 text-white shadow-sm" : "text-surface-500 hover:text-surface-900 hover:bg-surface-100"
              ].join(" ")}
            >
              {tab.label}
              {tab.id === "live" && (
                <span className={"w-1.5 h-1.5 rounded-full shrink-0 " + (isActive ? "bg-white animate-pulse" : "bg-danger-400")} />
              )}
            </button>
          );
        })}
      </div>

      {/* Type filters */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {TYPE_FILTERS.map(function(t) {
          var isActive = typeFilter === t.id;
          return (
            <button
              key={t.id}
              onClick={function() { setTypeFilter(t.id); }}
              className={[
                "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 border",
                isActive
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white text-surface-600 border-surface-200 hover:border-brand-300 hover:text-brand-700"
              ].join(" ")}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* States */}
      {loading && events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-brand-500 mb-3" />
          <p className="text-sm text-surface-400">Loading events...</p>
        </div>
      ) : error ? (
        <div className="card p-8 text-center">
          <p className="text-sm font-semibold text-surface-900 mb-1">Could not load events</p>
          <p className="text-xs text-surface-400 mb-4">{error}</p>
          <Button variant="secondary" size="sm" onClick={function() { loadEvents(filter, typeFilter, 1, true); }}>
            Try again
          </Button>
        </div>
      ) : events.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-sm font-semibold text-surface-900 mb-1">
            {filter === "upcoming" ? "No upcoming events" : filter === "live" ? "No live events right now" : "No past events"}
          </p>
          <p className="text-xs text-surface-400 mt-1">Check back soon or explore other communities.</p>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map(function(event) {
              return <EventCard key={event._id} event={event} onUpdate={handleEventUpdate} />;
            })}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-6">
              <Button
                variant="secondary"
                loading={loading}
                onClick={function() { loadEvents(filter, typeFilter, page + 1, false); }}
              >
                Load more
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
