import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AlertPanel from '../AlertPanel.jsx';

const mockAlerts = [
  { _id: '1', ward: 'Ward-1', severity: 'high',     recommendedAction: 'Open emergency shelters.' },
  { _id: '2', ward: 'Ward-2', severity: 'low',      recommendedAction: 'Advise residents to stay hydrated.' },
  { _id: '3', ward: 'Ward-3', severity: 'critical',  recommendedAction: 'Declare heat emergency.' },
];

describe('AlertPanel', () => {
  it('renders empty state when no alerts', () => {
    render(<AlertPanel alerts={[]} />);
    expect(screen.getByText(/No active alerts/i)).toBeInTheDocument();
  });

  it('renders all alerts', () => {
    render(<AlertPanel alerts={mockAlerts} />);
    expect(screen.getByText('Ward-1')).toBeInTheDocument();
    expect(screen.getByText('Ward-2')).toBeInTheDocument();
    expect(screen.getByText('Ward-3')).toBeInTheDocument();
  });

  it('renders severity badges', () => {
    render(<AlertPanel alerts={mockAlerts} />);
    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('low')).toBeInTheDocument();
    expect(screen.getByText('critical')).toBeInTheDocument();
  });

  it('expands recommended action on click', () => {
    render(<AlertPanel alerts={mockAlerts} />);
    // Initially hidden
    expect(screen.queryByText('Open emergency shelters.')).not.toBeInTheDocument();
    // Click first alert
    fireEvent.click(screen.getByText('Ward-1').closest('li'));
    expect(screen.getByText('Open emergency shelters.')).toBeInTheDocument();
  });

  it('collapses when clicked again', () => {
    render(<AlertPanel alerts={mockAlerts} />);
    const firstAlert = screen.getByText('Ward-1').closest('li');
    fireEvent.click(firstAlert);
    expect(screen.getByText('Open emergency shelters.')).toBeInTheDocument();
    fireEvent.click(firstAlert);
    expect(screen.queryByText('Open emergency shelters.')).not.toBeInTheDocument();
  });
});
