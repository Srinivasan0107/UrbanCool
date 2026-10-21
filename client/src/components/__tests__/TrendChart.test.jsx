import React from 'react';
import { render, screen } from '@testing-library/react';
import TrendChart from '../TrendChart.jsx';

const completedInit = {
  _id: 'ci-1',
  name: 'Tree Plantation - Ward-1',
  startDate: '2026-01-01T00:00:00.000Z',
  beforeTemp: 44,
  afterTemp: 38,
  status: 'completed',
};

const plannedInit = {
  _id: 'ci-2',
  name: 'Cool Roof - Ward-2',
  startDate: '2026-06-01T00:00:00.000Z',
  beforeTemp: 42,
  afterTemp: undefined,
  status: 'planned',
};

describe('TrendChart', () => {
  it('renders the temperature impact heading', () => {
    render(<TrendChart initiative={completedInit} />);
    expect(screen.getByText(/Temperature Impact/i)).toBeInTheDocument();
  });

  it('shows temperature reduction badge for completed initiative', () => {
    render(<TrendChart initiative={completedInit} />);
    expect(screen.getByText(/6\.0°C reduction/i)).toBeInTheDocument();
  });

  it('does not show reduction badge when no afterTemp', () => {
    render(<TrendChart initiative={plannedInit} />);
    expect(screen.queryByText(/reduction/i)).not.toBeInTheDocument();
  });

  it('renders no data message when initiative is null', () => {
    render(<TrendChart initiative={null} />);
    expect(screen.getByText(/No temperature data/i)).toBeInTheDocument();
  });
});
