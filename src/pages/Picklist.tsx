import { Link, Checkbox, Select, Button } from '@chakra-ui/react';
import { FC, SyntheticEvent, useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';

interface PicklistProps {}

const Picklist: FC<PicklistProps> = () => {
    const year = new Date().getFullYear();
    const { currentUser } = useAuth();
    const [regional, setRegional] = useState<string>('');
    const [regionals, setRegionals] = useState<string[]>([]);
    const [teams, setTeams] = useState<string[]>([]);
    const [picklist, setPicklist] = useState<string[]>([]);
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
        fetchRegionals();
    }, []);

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
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Select
                    isDisabled={!currentUser}
                    onChange={(e) => {
                        fetchTeams(e.target.value);
                        fetchPicklist(e.target.value);
                    }}
                    placeholder="Select Regional"
                    size="lg"
                    variant="filled"
                    justifySelf={'center'}
                    textAlign={'center'}
                    color="#1f0136"
                    width={'50vw'}
                    style={{
                        marginTop: '1rem',
                        marginBottom: '1rem',
                    }}
                >
                    {regionals?.map((regional) => {
                        return <option value={regional}>{regional}</option>;
                    })}
                </Select>
            </div>
            <div
                style={{
                    fontWeight: 'bold',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'fixed',
                    // margin: 'auto',
                    marginTop: '1.05rem',
                    marginBottom: '1rem',
                    top: '3vw',
                    right: '0.0vw',
                }}
            >
                <h3
                    style={{
                        margin: 'auto',
                        marginBottom: '0.5rem',
                        marginTop: '0.5rem',
                    }}
                >
                    Current Picklist:
                </h3>
                {picklist?.map((teamNum, index) => {
                    return (
                        <div
                            draggable
                            onDragStart={(e) => {
                                startDrag(e, index);
                            }}
                            onDragEnter={(e) => handleDragEnter(e, index)}
                        >
                            <h2
                                style={{
                                    marginRight: '2rem',
                                    marginBottom: '0.5rem',
                                    fontSize: '2rem',
                                }}
                            >
                                {teamNum}
                            </h2>
                        </div>
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
                    let isChecked: boolean = picklist.includes(team);
                    return (
                        <>
                            <Checkbox
                                size="lg"
                                isChecked={isChecked}
                                isDisabled={
                                    !currentUser ||
                                    (picklist.length > 2 && !isChecked)
                                }
                                spacing="1rem"
                                onChange={() => {
                                    addToPicklist(team);
                                }}
                            >
                                Suggest to Picklist
                            </Checkbox>
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
                        </>
                    );
                })}
            </div>
        </>
    );
};

export default Picklist;
