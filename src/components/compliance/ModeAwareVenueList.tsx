import { useTradingMode } from '@/hooks/useTradingMode';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  ExternalLink,
  Lock,
  Unlock,
} from 'lucide-react';

interface ModeAwareVenueListProps {
  showAll?: boolean;
  onVenueSelect?: (venueId: string) => void;
  selectedVenue?: string;
}

export function ModeAwareVenueList({ 
  showAll = false, 
  onVenueSelect,
  selectedVenue 
}: ModeAwareVenueListProps) {
  const { mode, availableVenues, integratedVenues } = useTradingMode();

  const venues = showAll ? availableVenues : integratedVenues;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">
          {showAll ? 'All Available Exchanges' : 'Integrated Exchanges'}
        </h4>
        <Badge variant="outline" className="text-xs">
          {mode === 'us' ? 'US Compliant' : 'International'}
        </Badge>
      </div>
      
      <div className="grid gap-2">
        {venues.map((venue) => {
          const isSelected = selectedVenue === venue.id;
          const isIntegrated = venue.apiIntegrated;
          
          return (
            <TooltipProvider key={venue.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card 
                    className={cn(
                      "cursor-pointer transition-all hover:border-primary/50",
                      isSelected && "border-primary ring-1 ring-primary/30",
                      !isIntegrated && "opacity-60"
                    )}
                    onClick={() => isIntegrated && onVenueSelect?.(venue.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{venue.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{venue.name}</span>
                              {venue.usCompliant && (
                                <Badge variant="outline" className="text-[10px] h-4 border-blue-500/30 text-blue-500">
                                  US OK
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{venue.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isIntegrated ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      
                      {/* Capabilities */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        <CapabilityBadge label="Spot" available={venue.capabilities.spot} />
                        <CapabilityBadge label="Futures" available={venue.capabilities.futures} />
                        <CapabilityBadge label="Perps" available={venue.capabilities.perpetuals} />
                        <CapabilityBadge label="Margin" available={venue.capabilities.margin} />
                        <CapabilityBadge label="Options" available={venue.capabilities.options} />
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>
                  {isIntegrated 
                    ? "API integrated - Ready for trading" 
                    : "Not yet integrated - Coming soon"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
      
      {mode === 'international' && (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-amber-500/90">
            Some international venues are not available to US persons. 
            Ensure you comply with your local regulations before trading.
          </p>
        </div>
      )}
    </div>
  );
}

function CapabilityBadge({ label, available }: { label: string; available: boolean }) {
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "text-[10px] h-4 px-1.5",
        available 
          ? "border-success/30 text-success" 
          : "border-muted text-muted-foreground/50"
      )}
    >
      {available ? (
        <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
      ) : (
        <XCircle className="h-2.5 w-2.5 mr-0.5" />
      )}
      {label}
    </Badge>
  );
}
