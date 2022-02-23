/* eslint-disable no-loop-func */
import { Link, Checkbox, Select, Box, Flex, Spinner } from '@chakra-ui/react';
import { FC, SyntheticEvent, useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';

interface PicklistProps {}

const Picklist: FC<PicklistProps> = () => {
    const year = new Date().getFullYear();
    const { currentUser } = useAuth();
    const [regional, setRegional] = useState<string>('cvr');
    const [regionals, setRegionals] = useState<string[]>([]);
    const [suggestedTeams, setSuggestedTeams] = useState<string[]>([]);
    const [teams, setTeams] = useState<string[]>([]);
    const [picklist, setPicklist] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const dragItem = useRef<number | null>();
    const dragNode = useRef<EventTarget | null>();

    useEffect(() => {
        if (picklist.length > 0 && regional.length > 2) {
            db.collection('years')
                .doc(year + '')
                .collection('regionals')
                .doc(regional)
                .collection('picklist')
                .doc('picklist')
                .set({
                    picklist: picklist,
                });
        }
    }, [year, picklist]);

    useEffect(() => {
        fetchRegionals()
        fetchPicklist(regional);
        fetchSuggestedTeams(regional);
        fetchTeams(regional);
    }, []);
    
    useEffect(() =>{
        setLoading(true);
        fetchPicklist(regional);
        fetchTeams(regional);
        fetchSuggestedTeams(regional);
    }, [regional])

    useEffect(()=>{
        setLoading(false);
    }, [suggestedTeams])
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
        if (teams.length > 1) setTeams([]);
        if (regionalChoice.length < 3) return;
        //setRegional(regionalChoice);
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

    const fetchSuggestedTeams = async (regionalChoice: string) => {
        //if (suggestedTeams.length > 1) setSuggestedTeams([]);
        if (regionalChoice.length < 3) return;
        //setRegional(regionalChoice);
        let suggested: string[] = [];
        let teamList = db.collection('years')
            .doc(year + '')
            .collection('regionals')
            .doc(regionalChoice)
            .collection('teams');
            teamList.get().then((data) => {
                let handleLoop = async() => {
                    let promises: Promise<any>[] = [];
                    for(let doc of data.docs){
                        promises.push(
                        teamList.doc(doc.id).collection('matches').get()
                        .then((matchList: any) => {
                            for(let match of matchList.docs) {
                                if(match.get("Suggest To Picklist")) { 
                                    suggested.push(doc.id);
                                    break;
                                };
                            };
                        }));
                    }
                    await Promise.all(promises);
                    setSuggestedTeams(suggested);
                    console.log(suggested);
                }
                handleLoop();
            })
    };

    const fetchPicklist = async (regionalChoice: string) => {
        setPicklist([]);
        db.collection('years')
            .doc(year + '')
            .collection('regionals')
            .doc(regionalChoice)
            .collection('picklist')
            .get()
            .then((fields) => {
                if (fields.docs[0]?.data().picklist.length > 0)
                    setPicklist(fields.docs[0].data().picklist);
                else setPicklist([]);
            });
    };

    const startDrag = (e: SyntheticEvent, index: number) => {
        console.log('start drag');
        dragItem.current = index;
        dragNode.current = e.target;
        dragNode.current.addEventListener('dragend', dragEnd);
    };

    const handleDragEnter = (e: SyntheticEvent, index: number) => {
        if (e.target !== dragNode.current) {
            setPicklist((oldPicklist) => {
                let newPicklist = JSON.parse(JSON.stringify(oldPicklist));
                newPicklist.splice(
                    index,
                    0,
                    newPicklist.splice(dragItem.current!, 1)[0],
                );
                return newPicklist;
            });
        }
    };

    const dragEnd = () => {
        console.log('drag end');
        dragNode?.current?.removeEventListener('dragend', dragEnd);
        dragItem.current = null;
        dragNode.current = null;
    };
    return (
        <>      
            <Flex alignItems={'center'} justifyContent={'center'}>
                <Select
                    isDisabled={!currentUser}
                    onChange={(e) => {
                        setRegional(e.target.value);
                        fetchTeams(e.target.value);
                        fetchSuggestedTeams(e.target.value);
                        fetchPicklist(e.target.value);
                    }}
                    size="lg"
                    variant="Unstyled"
                    justifySelf={'center'}
                    textAlign={'center'}
                    width="fit-content"
                >
                    {regionals?.map((regional) => {
                        return <option value={regional}>{regional.toUpperCase()}</option>;
                    })}
                </Select>
            </Flex>
                <Box bg={'mv-purple.200'}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingTop: '10px',
                        paddingBottom: '10px',
                        fontWeight: 'bold',
                    }}
                >
                    <h3
                        style={{
                            color: 'white',
                            margin: 'auto',
                            marginBottom: '0.35rem',
                            marginTop: '8px',
                            fontWeight: 'bolder',
                            fontSize : '20px'
                        }}
                    >
                        Current Picklist:
                    </h3>
                    <Flex align="center" justify="center">
                        {picklist?.map((teamNum, index) => {
                            return (
                                <div
                                    style={{
                                        marginLeft: '15px',
                                        marginRight: '15px',
                                    }}
                                    draggable
                                    onDragStart={(e) => {
                                        startDrag(e, index);
                                    }}
                                    onDragEnter={(e) =>
                                        handleDragEnter(e, index)
                                    }
                                >
                                    <h2
                                        style={{
                                            fontSize: '2rem',
                                            color: 'white',
                                        }}
                                    >
                                        {teamNum}
                                    </h2>
                                </div>
                            );
                        })}
                    </Flex>
                </div>
                </Box>
        
            <div
                style={{
                    display: 'grid',
                    flexDirection: 'column-reverse',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '10px',
                }}
            >
                <h3 style={{fontWeight: 'bolder'}}>All Teams:</h3>
                {teams?.map((team) => {
                    return (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                            }}
                        >
                            <Checkbox
                                mr="10px"
                                size="lg"
                                isChecked={picklist.includes(team)}
                                isDisabled={!currentUser}
                                spacing="1rem"
                                onChange={() => {
                                    addToPicklist(team);
                                }}
                            />
                            <Link
                                href={`./Dashboard/${year}/${regional}/${team}`}
                            >
                                <h1
                                    style={{
                                        fontSize: '1.25rem',
                                        fontWeight: 'bolder',
                                    }}
                                >
                                    {team}
                                </h1>
                            </Link>
                        </div>
                    );
                })}
                <h3 style={{fontWeight: 'bolder'}}>Suggested Teams:</h3>
                {suggestedTeams?.map((team) => {
                    return (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                            }}
                        >
                            <Checkbox
                                mr="10px"
                                size="lg"
                                isChecked={picklist.includes(team)}
                                isDisabled={!currentUser}
                                spacing="1rem"
                                onChange={() => {
                                    addToPicklist(team);
                                }}
                            />
                            <Link
                                href={`./Dashboard/${year}/${regional}/${team}`}
                            >
                                <h1
                                    style={{
                                        fontSize: '1.25rem',
                                        fontWeight: 'bolder',
                                    }}
                                >
                                    {team}
                                </h1>
                            </Link>
                        </div>
                    );
                })}
            </div>
        </>
    );
};

export default Picklist;
