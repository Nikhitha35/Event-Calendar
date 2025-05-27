import React, { useState } from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';

const FormOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const FormContainer = styled.div`
  background: white;
  padding: 24px;
  border-radius: 8px;
  width: 400px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const FormTitle = styled.h2`
  margin: 0 0 20px 0;
  color: #3c4043;
  font-size: 22px;
  font-weight: 400;
`;

const FormField = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  color: #3c4043;
  font-size: 14px;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #1a73e8;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #1a73e8;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 14px;
  min-height: 100px;

  &:focus {
    outline: none;
    border-color: #1a73e8;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
`;

const Button = styled.button`
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  border: none;
  
  ${props => props.primary ? `
    background-color: #1a73e8;
    color: white;
    &:hover {
      background-color: #1557b0;
    }
  ` : `
    background-color: #f1f3f4;
    color: #3c4043;
    &:hover {
      background-color: #e8eaed;
    }
  `}
`;

const EventForm = ({ event, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    title: event?.title || '',
    date: event?.date || new Date().toISOString().split('T')[0],
    time: event?.time || '12:00',
    description: event?.description || '',
    recurrence: event?.recurrence || 'none',
    recurrenceOptions: event?.recurrenceOptions || {
      frequency: 'daily',
      weeklyDays: [],
      monthlyDay: 1,
      customInterval: 1,
      endDate: null
    },
    color: event?.color || '#1a73e8'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const handleDelete = () => {
    if (event && window.confirm('Are you sure you want to delete this event?')) {
      onSubmit({ ...event, deleted: true });
      onClose();
    }
  };

  const RecurrenceOptions = () => {
    if (formData.recurrence === 'none') return null;

    return (
      <FormField>
        <Label>Recurrence Options</Label>
        {formData.recurrence === 'weekly' && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <label key={day} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="checkbox"
                  checked={formData.recurrenceOptions.weeklyDays.includes(day)}
                  onChange={(e) => {
                    const days = e.target.checked
                      ? [...formData.recurrenceOptions.weeklyDays, day]
                      : formData.recurrenceOptions.weeklyDays.filter(d => d !== day);
                    setFormData({
                      ...formData,
                      recurrenceOptions: {
                        ...formData.recurrenceOptions,
                        weeklyDays: days
                      }
                    });
                  }}
                />
                {day}
              </label>
            ))}
          </div>
        )}

        {formData.recurrence === 'monthly' && (
          <Input
            type="number"
            min="1"
            max="31"
            value={formData.recurrenceOptions.monthlyDay}
            onChange={(e) => setFormData({
              ...formData,
              recurrenceOptions: {
                ...formData.recurrenceOptions,
                monthlyDay: parseInt(e.target.value)
              }
            })}
          />
        )}

        {formData.recurrence === 'custom' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <Label>Repeat every</Label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Input
                  type="number"
                  min="1"
                  style={{ width: '80px' }}
                  value={formData.recurrenceOptions.customInterval}
                  onChange={(e) => setFormData({
                    ...formData,
                    recurrenceOptions: {
                      ...formData.recurrenceOptions,
                      customInterval: parseInt(e.target.value)
                    }
                  })}
                />
                <Select
                  value={formData.recurrenceOptions.frequency}
                  onChange={(e) => setFormData({
                    ...formData,
                    recurrenceOptions: {
                      ...formData.recurrenceOptions,
                      frequency: e.target.value
                    }
                  })}
                >
                  <option value="daily">Days</option>
                  <option value="weekly">Weeks</option>
                  <option value="monthly">Months</option>
                </Select>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: '8px' }}>
          <Label>End Date (Optional)</Label>
          <Input
            type="date"
            value={formData.recurrenceOptions.endDate || ''}
            onChange={(e) => setFormData({
              ...formData,
              recurrenceOptions: {
                ...formData.recurrenceOptions,
                endDate: e.target.value || null
              }
            })}
          />
        </div>
      </FormField>
    );
  };

  return (
    <FormOverlay onClick={onClose}>
      <FormContainer onClick={e => e.stopPropagation()}>
        <FormTitle>{event ? 'Edit Event' : 'New Event'}</FormTitle>
        <form onSubmit={handleSubmit}>
          <FormField>
            <Label>Title</Label>
            <Input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </FormField>
          
          <FormField>
            <Label>Date</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </FormField>

          <FormField>
            <Label>Time</Label>
            <Input
              type="time"
              value={formData.time}
              onChange={e => setFormData({ ...formData, time: e.target.value })}
              required
            />
          </FormField>

          <FormField>
            <Label>Description</Label>
            <TextArea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </FormField>

          <FormField>
            <Label>Recurrence</Label>
            <Select
              value={formData.recurrence}
              onChange={e => setFormData({
                ...formData,
                recurrence: e.target.value,
                recurrenceOptions: {
                  ...formData.recurrenceOptions,
                  weeklyDays: e.target.value === 'weekly' ? [format(new Date(formData.date), 'EEE')] : []
                }
              })}
            >
              <option value="none">None</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom</option>
            </Select>
          </FormField>

          <RecurrenceOptions />

          <FormField>
            <Label>Color</Label>
            <Input
              type="color"
              value={formData.color}
              onChange={e => setFormData({ ...formData, color: e.target.value })}
            />
          </FormField>

          <ButtonGroup>
            {event && (
              <Button type="button" onClick={handleDelete}>
                Delete
              </Button>
            )}
            <Button type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" primary>
              {event ? 'Save' : 'Create'}
            </Button>
          </ButtonGroup>
        </form>
      </FormContainer>
    </FormOverlay>
  );
};

export default EventForm;