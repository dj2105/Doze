import { createBrowserRouter } from 'react-router-dom';
import Lobby from './routes/Lobby';
import Keyroom from './routes/Keyroom';
import CodeRoom from './routes/CodeRoom';
import GameRoom from './routes/GameRoom';
import FinalRoom from './routes/FinalRoom';
import RejoinRoom from './routes/RejoinRoom';
import HowToPlay from './routes/HowToPlay';

export const router = createBrowserRouter([
  { path: '/', element: <Lobby /> },
  { path: '/keyroom', element: <Keyroom /> },
  { path: '/code/:gameId', element: <CodeRoom /> },
  { path: '/game/:gameId', element: <GameRoom /> },
  { path: '/final/:gameId', element: <FinalRoom /> },
  { path: '/rejoin', element: <RejoinRoom /> },
  { path: '/how-to-play', element: <HowToPlay /> }
]);
