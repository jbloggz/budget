/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * Dashboard.tsx: This file contains the dashboard page component
 */

import { useEffect, useState } from 'react';
import {
   AbsoluteCenter,
   Card,
   CardBody,
   Container,
   Divider,
   Heading,
   Spinner,
   Stat,
   StatArrow,
   StatHelpText,
   StatLabel,
   StatNumber,
   Text,
   useToast,
} from '@chakra-ui/react';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { useAPI } from '../hooks';
import { DashboardPanel, isDashboardPanel } from '../app.types';
import { prettyAmount } from '../utils';
import { DateRangePicker } from '../components';

interface PanelStatProps {
   panel: DashboardPanel;
}

const PanelStat = (props: PanelStatProps) => {
   const percent = Math.round(props.panel.diff * 10) / 10;
   const color = props.panel.diff < 0 ? 'green' : props.panel.diff < 10 ? 'orange' : 'red';

   return (
      <Stat>
         <StatLabel>{props.panel.category}</StatLabel>
         <StatNumber as={'span'}>
            <Text as={'span'} color={color} fontSize={'xl'}>
               {prettyAmount(props.panel.amount)}
            </Text>
         </StatNumber>
         <StatHelpText as={'span'} pl={4}>
            <StatArrow type={props.panel.diff > 0 ? 'increase' : 'decrease'} color={props.panel.diff < 0 ? 'green' : 'red'} />
            {Math.abs(percent)}%{' '}
            <Text color={'gray'} as={'span'}>
               ({prettyAmount(props.panel.limit)}
            </Text>
            )
         </StatHelpText>
      </Stat>
   );
};

const Dashboard = () => {
   const api = useAPI();
   const toast = useToast();
   const [dates, setDates] = useState<Date[]>([startOfMonth(new Date()), endOfMonth(new Date())]);
   const query = api.useQuery<DashboardPanel[]>({
      method: 'GET',
      url: '/api/dashboard/',
      params: new URLSearchParams({
         start: format(dates[0], 'yyyy-MM-dd'),
         end: format(dates[1], 'yyyy-MM-dd'),
      }),
      validate: (data: unknown): data is DashboardPanel[] => Array.isArray(data) && data.every((d) => isDashboardPanel(d)),
   });
   const panels = query.data?.data;

   useEffect(() => {
      if (query.isError) {
         toast({
            title: 'Error',
            description: query.error.message,
            status: 'error',
            duration: 5000,
         });
      }
   }, [query, toast]);

   const totalPanel = panels?.filter((p) => p.category === 'Total')[0];

   return (
      <>
         <Heading pb="8" size="lg">
            Dashboard
         </Heading>
         <Container>
            <DateRangePicker dates={dates} onChange={setDates} />
            {query.isFetching ? (
               <AbsoluteCenter>
                  <Spinner />
               </AbsoluteCenter>
            ) : (
               panels && (
                  <>
                     {totalPanel && (
                        <Card m={4} size={'sm'}>
                           <CardBody>
                              <PanelStat panel={totalPanel} />
                           </CardBody>
                        </Card>
                     )}
                     <Divider />
                     {panels
                        .filter((p) => p.category !== 'Total')
                        .map((panel) => (
                           <Card key={panel.category} m={4} size={'sm'}>
                              <CardBody>
                                 <PanelStat panel={panel} />
                              </CardBody>
                           </Card>
                        ))}
                  </>
               )
            )}
         </Container>
      </>
   );
};

export default Dashboard;
