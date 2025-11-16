import { createBrowserRouter } from 'react-router-dom';
import Lobby from './routes/Lobby';
import Keyroom from './routes/Keyroom';
import CodeRoom from './routes/CodeRoom';
import GameRoom from './routes/GameRoom';
import FinalRoom from './routes/FinalRoom';
import RejoinRoom from './routes/RejoinRoom';
import HowToPlay from './routes/HowToPlay';

const ROUTE_SEGMENTS = new Set([
  '',
  'keyroom',
  'code',
  'game',
  'final',
  'rejoin',
  'how-to-play'
]);

const resolveBasename = (pathname: string) => {
  const segments = pathname
    .split('/')
    .filter(Boolean);

  const knownIndex = segments.findIndex((segment) => ROUTE_SEGMENTS.has(segment));
  const baseSegments = knownIndex === -1 ? segments : segments.slice(0, knownIndex);
  const basePath = `/${baseSegments.join('/')}`;

  return basePath;
};

export const router = createBrowserRouter(
  [
    { path: '/', element: <Lobby /> },
    { path: '/keyroom', element: <Keyroom /> },
    { path: '/code/:gameId', element: <CodeRoom /> },
    { path: '/game/:gameId', element: <GameRoom /> },
    { path: '/final/:gameId', element: <FinalRoom /> },
    { path: '/rejoin', element: <RejoinRoom /> },
    { path: '/how-to-play', element: <HowToPlay /> }
  ],
  { basename: resolveBasename(window.location.pathname) }
);
