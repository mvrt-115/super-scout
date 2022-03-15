import { Button, Grid, Heading } from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import { db } from '../../firebase';
import { ReactComponent as Empty } from '../../assets/Empty.svg';

interface RouteParams {
    year: string;
    regional: string;
}

const Teams: FC<RouteComponentProps<RouteParams>> = ({ match }) => {
    const [teams, setTeams] = useState<string[]>([]);
    const [startDate, setStartDate] = useState<number>(Date.now());
    const year = match.params.year;
    const regional = match.params.regional;

    useEffect(() => {
        const fetchData = async () => {
            const teamsCollection = await db
                .collection('years')
                .doc(year)
                .collection('regionals')
                .doc(regional)
                .collection('teams')
                .get();
            const teams: string[] = teamsCollection.docs.map((doc) => doc.id);
            setTeams(teams);
        };
        fetch(`https://www.thebluealliance.com/api/v3/events/${year}/simple`, {
            headers: {
                'X-TBA-Auth-Key': process.env.REACT_APP_TBA_KEY || '',
            },
        })
            .then((res) => res.json())

        fetch(
            `https://www.thebluealliance.com/api/v3/event/${year}${regional}/simple`,
            {
                headers: {
                    'X-TBA-Auth-Key': process.env.REACT_APP_TBA_KEY || '',
                },
            },
        )
            .then((res) => res.json())
            .then((data) => {
                if (Date.parse(data['start_date']) <= Date.now()) fetchData();
                setStartDate(Date.parse(data['start_date']));
            });
    }, [year, regional]);
    const downloadData = async () =>{
        const teamList = db.collection("years").doc(year).collection("regionals").doc(regional).collection('teams');
        teamList.get().then(async (coll)=>{
            let obj: any = {"teams":{}};
            await Promise.all(coll.docs.map(async (doc)=>{
                let temp: any = {};
                temp = doc.data();
                temp['matchList'] = {};
                await teamList.doc(doc.id).collection("matches").get()
                .then((matches)=>{
                    matches.docs.forEach((match)=>{
                       temp['matchList'][match.id] =match.data();
                    })
                })
                obj["teams"][doc.id] = temp;
            }))
            const fileName = "file";
            const json = JSON.stringify(obj);
            const blob = new Blob([json],{type:'application/json'});
            const href = await URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = href;
            link.download = fileName + ".json";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        })
    }
    if (Date.now() < startDate)
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'column',
                }}
            >
                <Empty width={'90%'} height={'90%'} />
                <Heading
                    as="h3"
                    size="md"
                    textAlign={'center'}
                    marginTop={'2%'}
                >
                    The {regional.toUpperCase} has not started yet, please check
                    back after {new Date(startDate).toLocaleDateString()}
                </Heading>
            </div>
        );

    return (
        <><>
            <Button
                as={Link}
                to={`/dashboard/${year}/${regional}/regional-data/`}
                colorScheme="mv-purple"
                size="lg"
                width={'100%'}
            >
                View Regional Data
            </Button>
            <Button
                onClick={downloadData}
                colorScheme="mv-purple"
                size="lg"
                width={'100%'}
                marginTop = '2'
            >
                Download Data
            </Button>
        </><Grid
            gap={1}
            templateColumns={'repeat(auto-fit, minmax(200px, 1fr))'}
            width={'100%'}
        >
                {teams.map((team) => (
                    <li className="link" key={team}>
                        <Link
                            to={`/dashboard/${year}/${regional}/${team}`}
                            style={{ textAlign: 'center' }}
                        >
                            {team}
                        </Link>
                    </li>
                ))}
            </Grid>
        </>
    );
};

export default Teams;
