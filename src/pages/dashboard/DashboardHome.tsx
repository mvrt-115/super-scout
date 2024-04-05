import { Heading, Spinner } from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';
import { Link, useRouteMatch } from 'react-router-dom';
import { db } from '../../firebase';
import Search from './Search';

interface DashboardHomeProps {}

interface Year {
    year: string;
    regionals: string[];
}

const DashboardHome: FC<DashboardHomeProps> = () => {
    const [years, setYears] = useState<Year[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const match = useRouteMatch();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const yearsCollection = await db
                .collection('years')
                .orderBy('year')
                .get();
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
            setLoading(false);
            years.reverse();
            setYears(years);
        };
        fetchData();
    }, []);
    const moveData = async () => {
        let tempList: any[] = []
        const teamsList = await db.collection('years').doc('2024').collection("regionals").doc('cave').collection("teams").get().then((teams)=>{
            const temp = teams.docs;
            temp.forEach((team)=>{
                tempList.push(team.id)
            })
        });
        tempList.forEach((team)=>{
            db.collection("years").doc("2024").collection("regionals").doc("cave").collection("teams").doc(team).collection("matches").get().then((ids)=>{
                const matchList = ids.docs;
                matchList.forEach((match)=>{
                    const id = match.id;
                    db.collection("years").doc('2024').collection("regionals").doc("cave").collection("teams").doc(team).collection("matches").doc(id).get().then((data)=>{
                        let temp2:any = data.data();
                        if(temp2==undefined){
                            console.log(id+" "+team)
                        }
                        let temp3:any = temp2["Auton Speaker Missed"];
                        temp2["Auton Speaker Missed"] = temp2["Auton Speaker Scored"]
                        temp2["Auton Speaker Scored"] = temp3;
                        temp2["Auton Cycles"]+=temp2["Auton Speaker Scored"];
                        temp2["Total Cycles"]+=temp2["Auton Speaker Scored"];
                        if(team=="115"){
                            console.log(temp2);}
                        db.collection("years").doc("2024").collection("regionals").doc("cave").collection("teams").doc(team).collection("matches").doc(id).set(temp2);
                    })
                })
            })
        })
        //console.log(tempList)

    }
    if (loading) return <Spinner />;

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
            <Search />
            {years.map((year, index) => (
                <div style={{ width: '100%' }} key={index + ''}>
                    <Heading size={'md'}>{year.year}</Heading>
                    <ul key={year.year}>
                        {year.regionals.map((regional, index: number) => (
                            <li key={year.year + regional} className="link">
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
