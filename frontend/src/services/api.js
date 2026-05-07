import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const client = axios.create({
  baseURL: API,
  headers: { 'Content-Type': 'application/json' },
});

// Plots
export const createPlot = (payload) => client.post('/plots', payload).then((r) => r.data);
export const listPlots = () => client.get('/plots').then((r) => r.data);
export const getPlot = (id) => client.get(`/plots/${id}`).then((r) => r.data);
export const deletePlot = (id) => client.delete(`/plots/${id}`).then((r) => r.data);

// Transactions
export const createTransaction = (payload) =>
  client.post('/transactions', payload).then((r) => r.data);
export const listTransactions = (plotId) =>
  client
    .get('/transactions', { params: plotId ? { plot_id: plotId } : {} })
    .then((r) => r.data);
export const deleteTransaction = (id) =>
  client.delete(`/transactions/${id}`).then((r) => r.data);

// Dashboard
export const getDashboardSummary = () =>
  client.get('/dashboard/summary').then((r) => r.data);
