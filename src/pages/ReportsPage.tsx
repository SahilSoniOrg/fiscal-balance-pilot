import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Button } from '@/components/ui/button'; 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import ProfitAndLossDisplay from '@/components/reports/ProfitAndLossDisplay';
import TrialBalanceDisplay from '@/components/reports/TrialBalanceDisplay';
import BalanceSheetDisplay from '@/components/reports/BalanceSheetDisplay';
import apiService, {
  FetchProfitAndLossParams,
  FetchTrialBalanceParams,
  FetchBalanceSheetParams
} from '@/services/apiService';
import { ProfitAndLossReport, TrialBalanceReport, BalanceSheetReport } from '@/lib/types';

const ReportsPage: React.FC = () => {
  const { workplaceId } = useParams<{ workplaceId: string }>();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    return { from: startDate, to: endDate };
  });

  const formattedFromDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
  const formattedToDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;

  // State for Profit & Loss Report
  const [profitAndLossData, setProfitAndLossData] = useState<ProfitAndLossReport | null>(null);
  const [isLoadingPnL, setIsLoadingPnL] = useState<boolean>(false);
  const [errorPnL, setErrorPnL] = useState<Error | null>(null);

  // State for Trial Balance Report
  const [trialBalanceData, setTrialBalanceData] = useState<TrialBalanceReport | null>(null);
  const [isLoadingTB, setIsLoadingTB] = useState<boolean>(false);
  const [errorTB, setErrorTB] = useState<Error | null>(null);

  // State for Balance Sheet Report
  const [balanceSheetData, setBalanceSheetData] = useState<BalanceSheetReport | null>(null);
  const [isLoadingBS, setIsLoadingBS] = useState<boolean>(false);
  const [errorBS, setErrorBS] = useState<Error | null>(null);

  const handleApplyFilters = async () => {
    if (!workplaceId) {
      console.error('Workplace ID is missing');
      return;
    }
    if (!formattedFromDate || !formattedToDate) {
      console.error('Date range is not fully selected');
      return;
    }

    setProfitAndLossData(null);
    setErrorPnL(null);
    setIsLoadingPnL(true);

    setTrialBalanceData(null);
    setErrorTB(null);
    setIsLoadingTB(true);

    setBalanceSheetData(null);
    setErrorBS(null);
    setIsLoadingBS(true);

    try {
      const pnlParams: FetchProfitAndLossParams = { workplaceId, fromDate: formattedFromDate, toDate: formattedToDate };
      const tbParams: FetchTrialBalanceParams = { workplaceId, asOfDate: formattedToDate }; 
      const bsParams: FetchBalanceSheetParams = { workplaceId, asOfDate: formattedToDate }; 
      
      const results = await Promise.allSettled([
        apiService.fetchProfitAndLossReport(pnlParams),
        apiService.fetchTrialBalanceReport(tbParams),
        apiService.fetchBalanceSheetReport(bsParams),
      ]);

      // Process P&L result
      if (results[0].status === 'fulfilled') {
        const response = results[0].value;
        if (response.data) {
          setProfitAndLossData(response.data);
        } else {
          setErrorPnL(new Error(response.error || 'Failed to fetch Profit & Loss report'));
        }
      } else {
        setErrorPnL(results[0].reason as Error);
      }
      setIsLoadingPnL(false);

      // Process TB result
      if (results[1].status === 'fulfilled') {
        const response = results[1].value;
        if (response.data) {
          setTrialBalanceData(response.data);
        } else {
          setErrorTB(new Error(response.error || 'Failed to fetch Trial Balance report'));
        }
      } else {
        setErrorTB(results[1].reason as Error);
      }
      setIsLoadingTB(false);

      // Process BS result
      if (results[2].status === 'fulfilled') {
        const response = results[2].value;
        if (response.data) {
          setBalanceSheetData(response.data);
        } else {
          setErrorBS(new Error(response.error || 'Failed to fetch Balance Sheet report'));
        }
      } else {
        setErrorBS(results[2].reason as Error);
      }
      setIsLoadingBS(false);

    } catch (generalError) {
      console.error('An unexpected error occurred while fetching reports:', generalError);
      setIsLoadingPnL(false);
      setIsLoadingTB(false);
      setIsLoadingBS(false);
    }
  };

  const renderErrorAlert = (title: string, error: Error | null) => {
    if (!error) return null;
    return (
      <Alert variant="destructive" className="mt-4">
        <Terminal className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{error.message || 'An unknown error occurred.'}</AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Financial Reports</CardTitle>
          <CardDescription>
            Select a date range and click "Apply" to view the reports for your workplace.
            {workplaceId ? '' : ' Workplace ID is missing.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-4 space-y-4 sm:space-y-0">
            <DateRangePicker 
              date={dateRange} 
              onDateChange={setDateRange} 
              disabled={!workplaceId} 
            />
            <Button 
              onClick={handleApplyFilters} 
              disabled={!workplaceId || !formattedFromDate || !formattedToDate || isLoadingPnL || isLoadingTB || isLoadingBS}
              className="w-full sm:w-auto"
            >
              Apply Filters
            </Button>
          </div>
          {!workplaceId && (
             <p className="text-red-500 text-sm mt-2">Workplace ID is missing. Please ensure you are in a workplace context.</p>
          )}
          {!(formattedFromDate && formattedToDate) && workplaceId && (
             <p className="text-red-500 text-sm mt-2">Please select a valid date range.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profit & Loss</CardTitle>
          {profitAndLossData && (
            <CardDescription>
              For the period from {new Date(profitAndLossData.fromDate).toLocaleDateString()} to {new Date(profitAndLossData.toDate).toLocaleDateString()}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {isLoadingPnL && <p>Loading Profit & Loss Report...</p>}
          {renderErrorAlert('Failed to load Profit & Loss Report', errorPnL)}
          {!isLoadingPnL && !errorPnL && profitAndLossData && <ProfitAndLossDisplay reportData={profitAndLossData} />}
          {!isLoadingPnL && !errorPnL && !profitAndLossData && !isLoadingTB && !isLoadingBS && (
             <p className="text-muted-foreground">Select dates and click "Apply Filters" to view the report.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trial Balance</CardTitle>
          {trialBalanceData && (
            <CardDescription>
              As of {new Date(trialBalanceData.asOf).toLocaleDateString()}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {isLoadingTB && <p>Loading Trial Balance Report...</p>}
          {renderErrorAlert('Failed to load Trial Balance Report', errorTB)}
          {!isLoadingTB && !errorTB && trialBalanceData && <TrialBalanceDisplay reportData={trialBalanceData} />}
          {!isLoadingTB && !errorTB && !trialBalanceData && !isLoadingPnL && !isLoadingBS &&  (
            <p className="text-muted-foreground">Select dates and click "Apply Filters" to view the report.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Balance Sheet</CardTitle>
          {balanceSheetData && (
            <CardDescription>
              As of {new Date(balanceSheetData.asOf).toLocaleDateString()}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {isLoadingBS && <p>Loading Balance Sheet Report...</p>}
          {renderErrorAlert('Failed to load Balance Sheet Report', errorBS)}
          {!isLoadingBS && !errorBS && balanceSheetData && <BalanceSheetDisplay reportData={balanceSheetData} />}
          {!isLoadingBS && !errorBS && !balanceSheetData && !isLoadingPnL && !isLoadingTB &&  (
            <p className="text-muted-foreground">Select dates and click "Apply Filters" to view the report.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;
