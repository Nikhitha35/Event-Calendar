import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import styled from 'styled-components';
import { 
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  isBefore
} from 'date-fns';
import EventForm from './EventForm';

const CalendarContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  padding: 16px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid #f1f3f4;
`;

const MonthNavigation = styled.div`
  display: flex;
  align-items: center;
  gap: 32px;
`;

const MonthYearDisplay = styled.div`
  font-size: 22px;
  font-weight: 400;
  color: #3c4043;
  display: flex;
  gap: 8px;
`;

const ViewControls = styled.div`
  display: flex;
  gap: 24px;
  margin-left: 32px;
`;

const ViewButton = styled.button`
  border: none;
  background: none;
  padding: 4px 12px;
  font-size: 14px;
  color: ${props => props.active ? '#1a73e8' : '#3c4043'};
  cursor: pointer;
  border-radius: 4px;

  &:hover {
    background-color: #f1f3f4;
  }
`;

const NavigationButton = styled.button`
  border: none;
  background: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: #f1f3f4;
  }
`;

const SearchBar = styled.input`
  padding: 8px 16px;
  border: 1px solid #f1f3f4;
  border-radius: 4px;
  font-size: 14px;
  width: 200px;
  margin-left: auto;

  &:focus {
    outline: none;
    border-color: #1a73e8;
  }
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  flex: 1;
  border-top: 1px solid #e0e0e0;
`;

const WeekdayHeader = styled.div`
  padding: 8px;
  text-align: left;
  color: #70757a;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  border-bottom: 1px solid #e0e0e0;
  padding-left: 16px;
`;

const CalendarCell = styled.div`
  border-right: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
  padding: 8px;
  min-height: 100px;
  position: relative;
  background: ${props => props.isToday ? '#f8f9fa' : 'white'};
  color: ${props => props.isCurrentMonth ? '#3c4043' : '#70757a'};
  cursor: pointer;

  &:hover {
    background-color: #f8f9fa;
  }

  .date-number {
    font-size: 12px;
    margin-bottom: 8px;
    ${props => props.isToday && `
      background-color: #1a73e8;
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    `}
  }
`;

const EventIndicator = styled.div`
  margin: 2px 0;
  padding: 4px 6px;
  background-color: ${props => props.color || '#0051e4'};
  color: white;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.9;

  &:hover {
    opacity: 1;
  }
  cursor: grab;
  &:active {
    cursor: grabbing;
  }

  ${props => props.hasConflict && `
    border: 2px solid #d93025;
    margin: 0;
  `}
`;

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('Month');
  const [events, setEvents] = useState(() => {
    const savedEvents = localStorage.getItem('calendarEvents');
    return savedEvents ? JSON.parse(savedEvents) : [];
  });

  useEffect(() => {
    localStorage.setItem('calendarEvents', JSON.stringify(events));
  }, [events]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(currentDate);
  const startWeek = startOfWeek(startDate);
  const endWeek = endOfWeek(endDate);
  const days = eachDayOfInterval({ start: startWeek, end: endWeek });

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const handleCellClick = (date) => {
    setSelectedDate(date);
    setSelectedEvent(null);
    setShowEventForm(true);
  };

  const handleEventClick = (e, event) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setShowEventForm(true);
  };

  const handleEventSubmit = (eventData) => {
    if (eventData.deleted) {
      setEvents(events.filter(e => e !== selectedEvent));
      return;
    }

    const eventDate = new Date(eventData.date);
    const hasConflict = checkEventConflict(eventDate, eventData);

    if (hasConflict) {
      const proceed = window.confirm(
        'There is already an event scheduled at this time. Do you want to create this event anyway?'
      );
      if (!proceed) return;
    }

    if (selectedEvent) {
      setEvents(events.map(e => e === selectedEvent ? { ...eventData } : e));
    } else {
      setEvents([...events, { ...eventData, id: Date.now() }]);
    }
  };

  const getRecurringEventInstances = (event, startDate, endDate) => {
    const instances = [];
    const eventDate = new Date(event.date);
    let currentDate = new Date(eventDate);
    const recurrenceEndDate = event.recurrenceOptions.endDate 
      ? new Date(event.recurrenceOptions.endDate)
      : addMonths(endDate, 6); // Show up to 6 months of recurring events

    while (isBefore(currentDate, recurrenceEndDate)) {
      if (isBefore(currentDate, startDate)) {
        // Skip dates before the visible range
        currentDate = getNextRecurrence(currentDate, event);
        continue;
      }
      if (isBefore(endDate, currentDate)) break;

      instances.push({
        ...event,
        date: currentDate.toISOString().split('T')[0],
        isRecurrence: true
      });

      currentDate = getNextRecurrence(currentDate, event);
    }

    return instances;
  };

  const getNextRecurrence = (date, event) => {
    const { recurrence, recurrenceOptions } = event;

    switch (recurrence) {
      case 'daily':
        return addDays(date, 1);
      case 'weekly':
        if (recurrenceOptions.weeklyDays.length === 0) return addWeeks(date, 1);
        let nextDate = addDays(date, 1);
        while (!recurrenceOptions.weeklyDays.includes(format(nextDate, 'EEE'))) {
          nextDate = addDays(nextDate, 1);
        }
        return nextDate;
      case 'monthly':
        return addMonths(date, 1);
      case 'custom':
        const { frequency, customInterval } = recurrenceOptions;
        switch (frequency) {
          case 'daily':
            return addDays(date, customInterval);
          case 'weekly':
            return addWeeks(date, customInterval);
          case 'monthly':
            return addMonths(date, customInterval);
          default:
            return addDays(date, 1);
        }
      default:
        return addDays(date, 1);
    }
  };

  const getEventsForDay = (date) => {
    const regularEvents = events.filter(event => 
      isSameDay(new Date(event.date), date) && event.recurrence === 'none'
    );

    const recurringEvents = events
      .filter(event => event.recurrence !== 'none')
      .flatMap(event => getRecurringEventInstances(event, startWeek, endWeek))
      .filter(event => isSameDay(new Date(event.date), date));

    return [...regularEvents, ...recurringEvents];
  };

  const checkEventConflict = (date, eventToCheck) => {
    const dayEvents = events.filter(event => {
      if (event.id === eventToCheck.id) return false;
      
      const checkTimeConflict = (event1, event2) => {
        const [hour1, minute1] = event1.time.split(':').map(Number);
        const [hour2, minute2] = event2.time.split(':').map(Number);
        return hour1 === hour2 && minute1 === minute2;
      };
  
      if (event.recurrence === 'none') {
        return isSameDay(new Date(event.date), date) && 
               checkTimeConflict(event, eventToCheck);
      }
      
      const recurringInstances = getRecurringEventInstances(event, startWeek, endWeek);
      return recurringInstances.some(instance => 
        isSameDay(new Date(instance.date), date) && 
        checkTimeConflict(instance, eventToCheck)
      );
    });
    
    return dayEvents.length > 0;
  };

  return (
    <CalendarContainer>
      <Header>
        <MonthNavigation>
          <MonthYearDisplay>
            <span>{format(currentDate, 'MMMM')}</span>
            <span>{format(currentDate, 'yyyy')}</span>
          </MonthYearDisplay>
          <ViewControls>
            {['Day', 'Week', 'Month', 'Year'].map(viewOption => (
              <ViewButton
                key={viewOption}
                active={view === viewOption}
                onClick={() => setView(viewOption)}
              >
                {viewOption}
              </ViewButton>
            ))}
          </ViewControls>
        </MonthNavigation>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <NavigationButton onClick={handlePrevMonth}>←</NavigationButton>
          <NavigationButton onClick={handleNextMonth}>→</NavigationButton>
          <SearchBar placeholder="Search" />
        </div>
      </Header>
      <DragDropContext onDragEnd={handleDragEnd}>
        <CalendarGrid>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <WeekdayHeader key={day}>{day}</WeekdayHeader>
          ))}
          {days.map((day, index) => {
            const dayEvents = getEventsForDay(day).map((event, eventIndex) => {
              const hasConflict = checkEventConflict(day, event);
              return (
                <Draggable
                  key={event.id}
                  draggableId={`${event.id}`}
                  index={eventIndex}
                  isDragDisabled={false} // Remove the event.isRecurrence check
                >
                  {(provided, snapshot) => ( // Add snapshot parameter
                    <EventIndicator
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      ref={provided.innerRef}
                      color={event.color}
                      hasConflict={hasConflict}
                      onClick={(e) => handleEventClick(e, event)}
                      style={{
                        ...provided.draggableProps.style,
                        cursor: 'move',
                        opacity: snapshot.isDragging ? 0.5 : 1
                      }}
                    >
                      {event.title}
                    </EventIndicator>
                  )}
                </Draggable>
              );
            });

            return (
              <Droppable
                droppableId={`day-${format(day, 'yyyy-MM-dd')}`}
                key={format(day, 'yyyy-MM-dd')}
              >
                {(provided) => (
                  <CalendarCell
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    isToday={isSameDay(day, new Date())}
                    isCurrentMonth={isSameMonth(day, currentDate)}
                    onClick={() => handleCellClick(day)}
                  >
                    <div className="date-number">
                      {format(day, 'd')}
                    </div>
                    {dayEvents}
                    {provided.placeholder}
                  </CalendarCell>
                )}
              </Droppable>
            );
          })}
        </CalendarGrid>
      </DragDropContext>
      {showEventForm && (
        <EventForm
          event={selectedEvent}
          date={selectedDate}
          onSubmit={handleEventSubmit}
          onClose={() => setShowEventForm(false)}
        />
      )}
    </CalendarContainer>
  );
};

const handleDragEnd = (result) => {
  if (!result.destination) return;

  const { draggableId, destination } = result;
  const event = events.find(e => e.id.toString() === draggableId);
  const targetDate = new Date(destination.droppableId.split('day-')[1]);

  // Check for conflicts
  const hasConflict = checkEventConflict(targetDate, event);
  if (hasConflict) {
    const proceed = window.confirm(
      'There is already an event scheduled at this time. Do you want to move the event anyway?'
    );
    if (!proceed) return;
  }

  // Update event date
  setEvents(events.map(e => {
    if (e.id.toString() === draggableId) {
      return {
        ...e,
        date: format(targetDate, 'yyyy-MM-dd')
      };
    }
    return e;
  }));
};

export default Calendar;
