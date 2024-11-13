import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { format, setMinutes, getMinutes, getHours, setHours } from 'date-fns';

interface EditEventModalProps {
  event: {
    id: string;
    name: string;
    startDate: Timestamp;
    endDate: Timestamp;
  };
  onClose: () => void;
}

export default function EditEventModal({ event, onClose }: EditEventModalProps) {
  const queryClient = useQueryClient();

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = setMinutes(setHours(new Date(), hour), minute);
        options.push({
          value: format(time, 'HH:mm'),
          label: format(time, 'HH:mm')
        });
      }
    }
    return options;
  };

  const roundToNearestThirtyMinutes = (date: Date) => {
    const minutes = getMinutes(date);
    const roundedMinutes = Math.round(minutes / 30) * 30;
    return setMinutes(date, roundedMinutes);
  };

  const updateEventMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const startDate = new Date(formData.get('startDate') as string);
      const startTime = (formData.get('startTime') as string).split(':');
      startDate.setHours(parseInt(startTime[0]), parseInt(startTime[1]));
      
      const endDate = new Date(formData.get('endDate') as string);
      const endTime = (formData.get('endTime') as string).split(':');
      endDate.setHours(parseInt(endTime[0]), parseInt(endTime[1]));

      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        name: formData.get('name'),
        startDate: Timestamp.fromDate(roundToNearestThirtyMinutes(startDate)),
        endDate: Timestamp.fromDate(roundToNearestThirtyMinutes(endDate))
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      onClose();
    },
  });

  const timeOptions = generateTimeOptions();
  const startDate = event.startDate.toDate();
  const endDate = event.endDate.toDate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateEventMutation.mutate(formData);
  };

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nom de l'événement
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                defaultValue={event.name}
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
                  defaultValue={format(startDate, 'yyyy-MM-dd')}
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
                  defaultValue={format(startDate, 'HH:mm')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {timeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
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
                  defaultValue={format(endDate, 'yyyy-MM-dd')}
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
                  defaultValue={format(endDate, 'HH:mm')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {timeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
              <button
                type="submit"
                className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
              >
                Mettre à jour
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 sm:mt-0 inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}