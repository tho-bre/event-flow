import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BarChart2, Users, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

interface Event {
  id: string;
  name: string;
  startDate: Timestamp;
  endDate: Timestamp;
  location: string;
  attendeeCount?: number;
}

export default function Dashboard() {
  const { data: events, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const eventsRef = collection(db, 'events');
      const q = query(eventsRef, where('endDate', '>=', new Date()));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Event[];
    }
  });

  const stats = {
    totalEvents: events?.length || 0,
    upcomingEvents: events?.filter(e => e.startDate.toDate() > new Date()).length || 0,
    totalAttendees: events?.reduce((acc, event) => acc + (event.attendeeCount || 0), 0) || 0
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Events</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.totalEvents}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart2 className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Upcoming Events</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.upcomingEvents}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Attendees</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.totalAttendees}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg font-medium text-gray-900">Recent Events</h2>
        </div>
        <div className="border-t border-gray-200">
          <ul className="divide-y divide-gray-200">
            {events?.slice(0, 5).map((event) => (
              <li key={event.id}>
                <Link to={`/events/${event.id}`} className="block hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-blue-600 truncate">
                        {event.name}
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {format(event.startDate.toDate(), 'PPP')}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-between">
                      <div className="sm:flex">
                        <div className="text-sm text-gray-500">
                          {event.location}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {event.attendeeCount || 0} attendees
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}