import { Heading } from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';
import { Link, useRouteMatch } from 'react-router-dom';
import { db } from '../../firebase';

interface DashboardHomeProps { }

interface Year {
    year: string;
    regionals: string[];
}

const DashboardHome: FC<DashboardHomeProps> = () => {
    const [years, setYears] = useState<Year[]>([]);
    const match = useRouteMatch();

    useEffect(() => {
        const fetchData = async () => {
            const yearsCollection = await db.collection('years').get();
            const years: Year[] = await Promise.all(
                yearsCollection.docs.map(async (doc) => {
                    const regionalsCollection = await db
                        .collection('years')
                        .doc(doc.id)
                        .collection('regionals')
                        .get();
                    return {
                        year: doc.id,
                        regionals: regionalsCollection.docs.map(
                            (doc) => doc.id,
                        ),
                    };
                }),
            );
            setYears(years);
        };
        fetchData();
    }, []);

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
            }}
        >
            {years.map((year) => (
                <div style={{ width: '100%' }}>
                    <Heading size={'md'}>{year.year}</Heading>
                    <ul key={year.year}>
                        {year.regionals.map((regional, index: number) => (
                            <li key={year.year+regional} className="link">
                                <Link
                                    to={`${match.path}/${year.year}/${regional}/`}
                                >
                                    {regional.toUpperCase()}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
};

export default DashboardHome;
