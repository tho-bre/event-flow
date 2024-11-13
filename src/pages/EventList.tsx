import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs, addDoc, deleteDoc, doc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Plus, Trash2, Calendar as CalendarIcon, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import confetti from 'canvas-confetti';
import EditEventModal from '../components/EditEventModal';

interface Event {
  id: string;
  name: string;
  startDate: Timestamp;
  endDate: Timestamp;
  associationEmail: string;
  totalEntries: number;
}

export default function EventList() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const eventsRef = collection(db, 'events');
      const q = query(
        eventsRef,
        where('associationEmail', '==', user.email)
      );
      const snapshot = await getDocs(q);
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];

      // Tri côté client par date de début croissante
      return events.sort((a, b) => a.startDate.toMillis() - b.startDate.toMillis());
    },
    enabled: !!user?.email
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      await deleteDoc(doc(db, 'events', eventId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    }
  });

  const addEventMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const startDate = new Date(formData.get('startDate') as string);
      const startTime = (formData.get('startTime') as string).split(':');
      startDate.setHours(parseInt(startTime[0]), parseInt(startTime[1]));
      
      const endDate = new Date(formData.get('endDate') as string);
      const endTime = (formData.get('endTime') as string).split(':');
      endDate.setHours(parseInt(endTime[0]), parseInt(endTime[1]));

      await addDoc(collection(db, 'events'), {
        name: formData.get('name'),
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        associationEmail: user?.email,
        totalEntries: 0,
        entries: [],
        createdAt: Timestamp.now()
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setIsModalOpen(false);
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Événements</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un événement
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">Aucun événement</p>
            <p className="mt-1 text-sm text-gray-500">
              Commencez par créer votre premier événement
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {events.map((event) => {
              const now = new Date();
              const isActive = now >= event.startDate.toDate() && 
                             now <= event.endDate.toDate();
              const isFuture = now < event.startDate.toDate();
              
              return (
                <li key={event.id}>
                  <div className="px-4 py-4 flex items-center sm:px-6">
                    <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <div className="flex text-sm">
                          <p className="font-medium text-blue-600 truncate">{event.name}</p>
                        </div>
                        <div className="mt-2 flex">
                          <div className="flex items-center text-sm text-gray-500">
                            <CalendarIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            {isActive ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 animate-pulse">
                                En cours
                              </span>
                            ) : (
                              <p>{format(event.startDate.toDate(), 'PPP', { locale: fr })}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="ml-5 flex-shrink-0 flex space-x-2">
                      {isActive && (
                        <button
                          onClick={() => navigate(`/scanner/${event.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Pointeuse
                        </button>
                      )}
                      {!isFuture && (
                        <button
                          onClick={() => navigate(`/reports/${event.id}`)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Rapports
                        </button>
                      )}
                      <button
                        onClick={() => setEditingEvent(event)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
                            deleteEventMutation.mutate(event.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <form onSubmit={(e) => {
                e.preventDefault();
                addEventMutation.mutate(new FormData(e.currentTarget));
              }} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Nom de l'événement
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                      Date de début
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      id="startDate"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                      Heure de début
                    </label>
                    <select
                      name="startTime"
                      id="startTime"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      {Array.from({ length: 48 }, (_, i) => {
                        const hour = Math.floor(i / 2);
                        const minute = (i % 2) * 30;
                        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                      }).map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                      Date de fin
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      id="endDate"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                      Heure de fin
                    </label>
                    <select
                      name="endTime"
                      id="endTime"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      {Array.from({ length: 48 }, (_, i) => {
                        const hour = Math.floor(i / 2);
                        const minute = (i % 2) * 30;
                        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                      }).map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
                  <button
                    type="submit"
                    className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                  >
                    Ajouter
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="mt-3 sm:mt-0 inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
        />
      )}
    </div>
  );
}