// Centralised Chart.js v4 registration. Importing this module from any
// page ensures every controller, element, scale, and plugin used across
// the dashboard is registered exactly once on the global `Chart` class.
//
// Why centralise: Chart.js v4 requires explicit registration of each
// piece (tree-shaking). Per-page registration is order-dependent — a
// page that only registered ArcElement would crash on cold load with
// `"doughnut" is not a registered controller` until another page
// (registering DoughnutController) had run first.
import {
  Chart,
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  DoughnutController,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  ScatterController,
  Title,
  Tooltip,
} from 'chart.js';

Chart.register(
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  DoughnutController,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  ScatterController,
  Title,
  Tooltip
);

export { Chart };
