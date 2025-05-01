
import React, { useState } from 'react';
import JournalsList from '../components/journals/JournalsList';
import JournalDetail from '../components/journals/JournalDetail';
import { Journal } from '../lib/types';

const JournalsPage: React.FC = () => {
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-10rem)]">
      <div className="md:col-span-1 h-full">
        <JournalsList onSelectJournal={setSelectedJournal} />
      </div>
      <div className="md:col-span-2 h-full">
        <JournalDetail journal={selectedJournal} />
      </div>
    </div>
  );
};

export default JournalsPage;
