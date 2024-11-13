import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Plus, Minus, Wifi, WifiOff, BarChart2 } from 'lucide-react';
import { useFirestoreConnection } from '../hooks/useFirestoreConnection';

export default function Scanner() {
  const { eventId } = useParams();
  const queryClient = useQueryClient();
  const { isOnline } = useFirestoreConnection();

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const docRef = doc(db, 'events', eventId!);
      const docSnap = await getDoc(docRef);
      return { id: docSnap.id, ...docSnap.data() };
    },
  });

  const updateCountMutation = useMutation({
    mutationFn: async ({ isIncrement }: { isIncrement: boolean }) => {
      const eventRef = doc(db, 'events', eventId!);
      const newEntry = {
        timestamp: Timestamp.now(),
        type: isIncrement ? 'entry' : 'exit'
      };
      
      // Récupérer les données actuelles
      const docSnap = await getDoc(eventRef);
      const currentData = docSnap.data();
      const currentEntries = currentData?.entries || [];
      const currentTotal = currentData?.totalEntries || 0;

      // Mettre à jour avec les nouvelles données
      await updateDoc(eventRef, {
        entries: [...currentEntries, newEntry],
        totalEntries: isIncrement ? currentTotal + 1 : currentTotal - 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const now = new Date();
  const startDate = event?.startDate?.toDate();
  const endDate = event?.endDate?.toDate();
  const isEventActive = startDate <= now && now <= endDate;

  if (!isEventActive) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-2 text-sm font-medium text-gray-900">Événement non actif</h3>
        <p className="mt-1 text-sm text-gray-500">
          La pointeuse n'est disponible que pendant l'événement.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow-lg rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Pointeuse - {event?.name}
            </h3>
            <div className="flex items-center space-x-4">
              <Link
                to={`/reports/${eventId}`}
                className="text-blue-600 hover:text-blue-800"
              >
                <BarChart2 className="h-5 w-5" />
              </Link>
              {isOnline ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
            </div>
          </div>

          <div className="text-center mb-8">
            <p className="text-4xl font-bold text-gray-900">
              {event?.totalEntries || 0}
            </p>
            <p className="text-sm text-gray-500">Entrées totales</p>
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={() => updateCountMutation.mutate({ isIncrement: true })}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Plus className="h-6 w-6" />
            </button>
            <button
              onClick={() => updateCountMutation.mutate({ isIncrement: false })}
              disabled={!event?.totalEntries}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Minus className="h-6 w-6" />
            </button>
          </div>

          {/* Liste des dernières entrées/sorties */}
          <div className="mt-8">
            <h4 className="text-sm font-medium text-gray-500 mb-4">Dernières activités</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {event?.entries?.slice(-5).reverse().map((entry: any, index: number) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-2 rounded-md ${
                    entry.type === 'entry' ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  <span className={entry.type === 'entry' ? 'text-green-700' : 'text-red-700'}>
                    {entry.type === 'entry' ? 'Entrée' : 'Sortie'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {entry.timestamp.toDate().toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}