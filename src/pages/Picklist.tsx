/* eslint-disable no-loop-func */
import {
    Link,
    Checkbox,
    Select,
    Box,
    Flex,
    Spinner,
    textDecoration,
    transition,
} from '@chakra-ui/react';
import { FC, SyntheticEvent, useEffect, useState, useRef } from 'react';
import { IoEaselSharp } from 'react-icons/io5';
import { LineChart } from 'recharts';
import { transform } from 'typescript';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';

interface PicklistProps {}

const Picklist: FC<PicklistProps> = () => {
    const year = new Date().getFullYear();
    const { currentUser } = useAuth();
    const [regional, setRegional] = useState<string>('casf');
    const [regionals, setRegionals] = useState<string[]>([]);
    const [suggestedTeams, setSuggestedTeams] = useState<string[]>([]);
    const [firstPickTeams, setFirstPickTeams] = useState<string[]>([]);
    const [secondPickTeams, setSecondPickTeams] = useState<string[]>([]);
    const [offensePicklist, setOffensePicklist] = useState<string[]>([]);
    const [defensePicklist, setDefensePicklist] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const dragItem = useRef<number | null>();
    const dragNode = useRef<EventTarget | null>();

    useEffect(() => {
        if (offensePicklist.length > 0 && regional.length > 2) {
            db.collection('years')
                .doc(year + '')
                .collection('regionals')
                .doc(regional)
                .collection('picklist')
                .doc('offensePicklist')
                .set({
                    offensePicklist: offensePicklist,
                });
        }
    }, [year, offensePicklist]);

    useEffect(() => {
        if (defensePicklist.length > 0 && regional.length > 2) {
            db.collection('years')
                .doc(year + '')
                .collection('regionals')
                .doc(regional)
                .collection('picklist')
                .doc('defensePicklist')
                .set({
                    defensePicklist: defensePicklist,
                });
        }
    }, [year, defensePicklist]);

    useEffect(() => {
        fetchRegionals();
        fetchPicklist(regional, 'offense');
        fetchPicklist(regional, 'defense');
        fetchFirstPickTeams(regional);
        fetchSecondPickTeams(regional);
    }, []);

    useEffect(() => {
        setLoading(true);
        fetchPicklist(regional, 'offense');
        fetchPicklist(regional, 'defense');
        fetchFirstPickTeams(regional);
        fetchSecondPickTeams(regional);
    }, [regional]);

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

    const addToPicklist = (team: string, picklistType: string) => {
        if (picklistType === 'offense') {
            let newArray = [...offensePicklist];
            offensePicklist.includes(team)
                ? newArray.splice(offensePicklist.indexOf(team), 1)
                : newArray.push(team);
            setOffensePicklist(newArray);
        } else if (picklistType === 'defense') {
            let newArray = [...defensePicklist];
            defensePicklist.includes(team)
                ? newArray.splice(defensePicklist.indexOf(team), 1)
                : newArray.push(team);
            setDefensePicklist(newArray);
        }
    };

    const fetchFirstPickTeams = async (regionalChoice: string) => {
        console.log(regionalChoice)
        if (firstPickTeams.length > 1) setFirstPickTeams([]);
        if (regionalChoice.length < 3) return;
        //setRegional(regionalChoice);
        db.collection('years')
            .doc(year + '')
            .collection('regionals')
            .doc(regionalChoice)
            .collection('teams') 
            .get()
            .then((data) => {
                // console.log(data);
                let teams = data.docs.map((doc) => {
                    return doc.id;
                });
                setFirstPickTeams(teams);
            });
        setLoading(false);
    };

    const fetchSecondPickTeams = async (regionalChoice: string) => {
        if (secondPickTeams.length > 1) setSecondPickTeams([]);
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
                setSecondPickTeams(teams);
            });
    };

    const fetchPicklist = async (
        regionalChoice: string,
        picklistType: string,
    ) => {
        setOffensePicklist([]);
        setDefensePicklist([]);
        db.collection('years')
            .doc(year + '')
            .collection('regionals')
            .doc(regionalChoice)
            .collection('picklist')
            .get()
            .then((fields) => {
                if (picklistType === 'offense') {
                    if (fields.docs[0]?.data().offensePicklist?.length > 0) 
                        setOffensePicklist(
                            fields.docs[0].data().offensePicklist,
                        );
                    else setOffensePicklist([]);
                } else if (picklistType === 'defense') {
                    if (fields.docs[0]?.data().defensePicklist?.length > 0)
                        setDefensePicklist(
                            fields.docs[0].data().defensePicklist,
                        );
                    else setDefensePicklist([]);
                }
            });
    };

    const startDrag = (e: SyntheticEvent, index: number) => {
        dragItem.current = index;
        dragNode.current = e.target;
        dragNode.current.addEventListener('dragend', dragEnd);
    };

    const handleDragEnter = (
        e: SyntheticEvent,
        index: number,
        picklistType: string,
    ) => {
        if (e.target !== dragNode.current) {
            if (picklistType === 'offense') {
                setOffensePicklist((oldPicklist) => {
                    let newPicklist = JSON.parse(JSON.stringify(oldPicklist));
                    newPicklist.splice(
                        index,
                        0,
                        newPicklist.splice(dragItem.current!, 1)[0],
                    );
                    return newPicklist;
                });
            } else if (picklistType === 'defense') {
                setDefensePicklist((oldPicklist) => {
                    let newPicklist = JSON.parse(JSON.stringify(oldPicklist));
                    newPicklist.splice(
                        index,
                        0,
                        newPicklist.splice(dragItem.current!, 1)[0],
                    );
                    return newPicklist;
                });
            }
        }
    };

    const dragEnd = () => {
        dragNode?.current?.removeEventListener('dragend', dragEnd);
        dragItem.current = null;
        dragNode.current = null;
    };

    if (loading) {
        return (
            <div
                style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <Spinner />
            </div>
        );
    }
    return (
        <>
            <Flex alignItems={'center'} justifyContent={'center'}>
                <Box bg={'mv.purple-200'}>
                    <Select
                        isDisabled={!currentUser}
                        onChange={(e) => {
                            setRegional(e.target.value);
                            fetchFirstPickTeams(e.target.value);
                            fetchSecondPickTeams(e.target.value);
                            fetchPicklist(e.target.value, 'offense');
                            fetchPicklist(e.target.value, 'defense');
                        }}
                        size="lg"
                        variant="Unstyled"
                        justifySelf={'center'}
                        textAlign={'center'}
                    >
                        {regionals?.map((regional) => {
                            return (
                                <option value={regional} >
                                    {regional.toUpperCase()}
                                </option>
                            );
                        })}
                    </Select>
                </Box>
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
                            fontSize: '20px',
                        }}
                    >
                        Current First Pick List:
                    </h3>
                    <Flex align="center" justify="center" style={
                        {
                            flexWrap: 'wrap',
                        }
                    }>
                        {offensePicklist?.map((teamNum, index) => {
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
                                        handleDragEnter(e, index, 'offense')
                                    }
                                >
                                    <Link
                                        href={`./Dashboard/${year}/${regional}/${teamNum}`}
                                        color={'white'}
                                        // styles={{
                                        //     position: 'relative',
                                        //     textDecoration: 'none'
                                        // }}
                                        isExternal
                                    >
                                        <h2
                                            style={{
                                                fontSize: '2rem',
                                                color: 'white',
                                            }}
                                        >
                                            {`${index + 1}. ${teamNum}`}
                                        </h2>
                                    </Link>
                                </div>
                            );
                        })}
                    </Flex>
                </div>
            </Box>
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
                            fontSize: '20px',
                        }}
                    >
                        Current Second Pick List:
                    </h3>
                    <Flex align="center" justify="center" style={
                        {
                            flexWrap: 'wrap',
                        }
                    }>
                        {defensePicklist?.map((teamNum, index) => {
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
                                        handleDragEnter(e, index, 'defense')
                                    }
                                >
                                    <Link
                                        href={`./Dashboard/${year}/${regional}/${teamNum}`}
                                        color={'white'}
                                        // styles={{
                                        //     position: 'relative',
                                        //     textDecoration: 'none',
                                        // }}
                                        isExternal
                                    >
                                        <h2
                                            style={{
                                                fontSize: '2rem',
                                                color: 'white',
                                            }}
                                        >
                                            {`${index + 1}. ${teamNum}`}
                                        </h2>
                                    </Link>
                                </div>
                            );
                        })}
                    </Flex>
                </div>
            </Box>
            <div style={{ display: 'flex' }}>
                <div
                    style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: '1.0vh',
                    }}
                >
                    <h3
                        style={{
                            fontWeight: 'bolder',
                            fontSize: '1.75rem',
                            textAlign: 'center',
                        }}
                    >
                        First Pick List:
                    </h3>
                    {firstPickTeams?.map((team) => {
                        return (
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'flex-start',
                                    marginLeft: '20vw',
                                }}
                            >
                                <Checkbox
                                    mr="10px"
                                    size="lg"
                                    isChecked={offensePicklist.includes(team)}
                                    isDisabled={!currentUser}
                                    spacing="1rem"
                                    onChange={() => {
                                        addToPicklist(team, 'offense');
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
                <div
                    style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        verticalAlign: 'middle',
                        marginTop: '1vh',
                    }}
                >
                    <h3
                        style={{
                            fontWeight: 'bolder',
                            fontSize: '1.75rem',
                            marginRight: '2.',
                            textAlign: 'center',
                        }}
                    >
                        Second Pick List:
                    </h3>
                    {secondPickTeams?.map((team) => {
                        return (
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'flex-start',
                                    marginLeft: '20vw',
                                }}
                            >
                                <Checkbox
                                    mr="10px"
                                    size="lg"
                                    isChecked={defensePicklist.includes(team)}
                                    isDisabled={!currentUser}
                                    spacing="1rem"
                                    onChange={() => {
                                        addToPicklist(team, 'defense');
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
            </div>
        </>
    );
};

export default Picklist;
