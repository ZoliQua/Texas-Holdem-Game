import { ArcadeShell } from './arcade';
import { HoldemGame } from './HoldemGame';

export default function App() {
  return (
    <ArcadeShell gameId="holdem">
      <HoldemGame />
    </ArcadeShell>
  );
}
