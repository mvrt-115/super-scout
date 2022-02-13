import { Link, Checkbox, Select, Button } from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';

interface PicklistProps {}

const Picklist: FC<PicklistProps> = () => {
    const year = new Date().getFullYear();
    const { currentUser } = useAuth();
    // const [loading, setLoading] = useState<boolean>(true);
    const [regional, setRegional] = useState<string>();
    const [regionals, setRegionals] = useState<string[]>([]);
    const [teams, setTeams] = useState<string[]>([]);
    const [picklist, setPicklist] = useState<string[]>([]);

    const fetchRegionals = async () => {
        db.collection('years')
            .doc(year + '')
            .collection('regionals')
            .get()
            .then((data) => {
                let temp: string[] = [];
                data.docs.forEach((doc) => {
                    temp.push(doc.id);
                });
                setRegionals(temp);
            });
    };

    const addToPicklist = (team: string) => {
        let newArray = [...picklist];
        picklist.includes(team)
            ? newArray.splice(picklist.indexOf(team), 1)
            : newArray.push(team);
        setPicklist(newArray);
    };

    const fetchTeams = async (regionalChoice: string) => {
        if (regionalChoice.length < 3) return;
        setRegional(regionalChoice);
        db.collection('years')
            .doc(year + '')
            .collection('regionals')
            .doc(regionalChoice)
            .collection('teams')
            .get()
            .then((data) => {
                let teams = data.docs.map((doc) => {
                    return doc.id;
                });
                setTeams(teams);
            });
    };

    useEffect(() => {
        fetchRegionals();
    }, []);

    return (
        <>
            <Select
                onChange={(e) => {
                    fetchTeams(e.target.value);
                }}
                placeholder="Select Regional"
            >
                {regionals?.map((regional) => {
                    return <option value={regional}>{regional}</option>;
                })}
            </Select>
            <div
                style={{
                    fontWeight: 'bold',
                }}
            >
                {picklist?.map((teamNum) => {
                    return (
                        <h2
                            style={{
                                marginLeft: '0.5em',
                                marginBottom: '0.5em',
                            }}
                        >
                            {teamNum}
                        </h2>
                    );
                })}
            </div>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {teams?.map((team) => {
                    return (
                        <>
                            <Checkbox
                                size="md"
                                isDisabled={!currentUser}
                                spacing="1rem"
                                onChange={() => {
                                    addToPicklist(team);
                                }}
                            >
                                Suggest to Picklist
                            </Checkbox>
                            <Link href={`./Dashboard/2019/${regional}/${team}`}>
                                {/* year is hard coded now, will change later when data is valid for the year 2022*/}
                                <h1
                                    style={{
                                        fontSize: '2vw',
                                        fontWeight: 'bolder',
                                    }}
                                >
                                    {team}
                                </h1>
                            </Link>
                        </>
                    );
                })}
                <Button colorScheme={'#2f064b'}>Save</Button>
            </div>
        </>
    );
};

export default Picklist;
