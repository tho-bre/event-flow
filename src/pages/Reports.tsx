import React, { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { jsPDF } from 'jspdf';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Download, ScanLine } from 'lucide-react';
import { format, addMinutes, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import html2canvas from 'html2canvas';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

type TimeInterval = '30min' | '1hour' | '3hours';

export default function Reports() {
  const { eventId } = useParams();
  const [timeInterval, setTimeInterval] = useState<TimeInterval>('1hour');
  const chartRef = useRef(null);

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const docRef = doc(db, 'events', eventId!);
      const docSnap = await getDoc(docRef);
      return { id: docSnap.id, ...docSnap.data() };
    },
  });

  const generateTimeSlots = (startDate: Date, endDate: Date, interval: TimeInterval) => {
    const slots: { start: Date; end: Date }[] = [];
    let current = startDate;

    const intervalMinutes = interval === '30min' ? 30 : interval === '1hour' ? 60 : 180;

    while (current < endDate) {
      const slotEnd = addMinutes(current, intervalMinutes);
      slots.push({
        start: current,
        end: slotEnd > endDate ? endDate : slotEnd
      });
      current = slotEnd;
    }

    return slots;
  };

  const getChartData = () => {
    if (!event?.entries || !event.startDate || !event.endDate) {
      return {
        labels: [],
        datasets: []
      };
    }

    const startDate = event.startDate.toDate();
    const endDate = event.endDate.toDate();
    const timeSlots = generateTimeSlots(startDate, endDate, timeInterval);

    const data = timeSlots.map(slot => {
      const entriesInSlot = event.entries.filter((entry: any) => {
        const entryDate = entry.timestamp.toDate();
        return isWithinInterval(entryDate, { start: slot.start, end: slot.end });
      });

      const entriesCount = entriesInSlot.reduce((acc: number, entry: any) => {
        return acc + (entry.type === 'entry' ? 1 : -1);
      }, 0);

      return {
        time: format(slot.start, timeInterval === '30min' ? 'HH:mm' : 'HH:00'),
        count: entriesCount
      };
    });

    return {
      labels: data.map(d => d.time),
      datasets: [
        {
          label: 'Entrées',
          data: data.map(d => d.count),
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
          borderRadius: 8,
        }
      ]
    };
  };

  const generatePDF = async () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Rapport d\'événement', 20, 20);

    // Event Details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Événement: ${event?.name}`, 20, 40);
    doc.text(`Date: ${format(event?.startDate.toDate(), 'PPP', { locale: fr })}`, 20, 50);
    doc.text(`Total des entrées: ${event?.totalEntries || 0}`, 20, 60);

    // Add chart
    if (chartRef.current) {
      const canvas = await html2canvas(chartRef.current);
      const chartImage = canvas.toDataURL('image/png');
      doc.addImage(chartImage, 'PNG', 20, 80, 170, 100);
    }

    doc.save(`rapport-${event?.name}-${format(new Date(), 'dd-MM-yyyy')}.pdf`);
  };

  const now = new Date();
  const isEventActive = event && 
    now >= event.startDate.toDate() && 
    now <= event.endDate.toDate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Permet au graphique de s'adapter à la hauteur du conteneur
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            family: 'Inter, sans-serif',
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: 'Distribution des entrées',
        font: {
          family: 'Inter, sans-serif',
          size: 16,
          weight: 'bold'
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: {
            family: 'Inter, sans-serif'
          }
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        ticks: {
          font: {
            family: 'Inter, sans-serif'
          }
        }
      }
    },
    animation: {
      duration: 2000,
      easing: 'easeInOutQuart'
    }
  };

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Rapport d'événement</h1>
        <div className="flex flex-wrap gap-2">
          {isEventActive && (
            <Link
              to={`/scanner/${eventId}`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <ScanLine className="h-4 w-4 mr-2" />
              Pointeuse
            </Link>
          )}
          <button
            onClick={generatePDF}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Télécharger PDF
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Nom de l'événement</h3>
            <p className="mt-1 text-xl font-semibold text-gray-900">
              {event?.name}
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Total des entrées</h3>
            <p className="mt-1 text-xl font-semibold text-gray-900">
              {event?.totalEntries || 0}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Intervalle de temps
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTimeInterval('30min')}
              className={`px-4 py-2 rounded-md ${
                timeInterval === '30min'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              30 minutes
            </button>
            <button
              onClick={() => setTimeInterval('1hour')}
              className={`px-4 py-2 rounded-md ${
                timeInterval === '1hour'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              1 heure
            </button>
            <button
              onClick={() => setTimeInterval('3hours')}
              className={`px-4 py-2 rounded-md ${
                timeInterval === '3hours'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              3 heures
            </button>
          </div>
        </div>

        {/* Conteneur avec une hauteur fixe pour le graphique */}
        <div className="h-[300px] sm:h-[400px] md:h-[500px] mt-6" ref={chartRef}>
          <Bar data={getChartData()} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}