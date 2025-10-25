import { Trophy, Flame, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StatsBarProps {
  tokens: number;
  streak: number;
}

export function StatsBar({ tokens, streak }: StatsBarProps) {
  return (
    <div className="flex items-center gap-3">
      <Badge variant="secondary" className="px-3 py-1.5 flex items-center gap-1.5">
        <Trophy className="h-4 w-4 text-accent" />
        <span className="font-semibold">{tokens} tokens</span>
      </Badge>
      <Badge variant="secondary" className="px-3 py-1.5 flex items-center gap-1.5">
        <Flame className="h-4 w-4 text-destructive" />
        <span className="font-semibold">{streak} streak</span>
      </Badge>
      <Badge variant="secondary" className="p-1.5">
        <User className="h-4 w-4" />
      </Badge>
    </div>
  );
}
