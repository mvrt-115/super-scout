import { AddIcon } from '@chakra-ui/icons';
import {
    Box,
    Button,
    Heading,
    IconButton,
    Spinner,
    VStack,
} from '@chakra-ui/react';
import { AnyPointerEvent } from 'framer-motion/types/gestures/PanSession';
import React, { FC, useEffect, useState } from 'react';
import ScoutInputInput from '../components/ScoutInputInput';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';

interface ScoutingInputsProps { }

const ScoutingInputs: FC<ScoutingInputsProps> = () => {
    const year = new Date().getFullYear();
    const [autonInputs, setAutonInputs] = useState<ScoutInputData[]>([
        {
            key: 'key',
            type: 'counter',
        },
    ]);
    const [teleopInputs, setTeleopInputs] = useState<ScoutInputData[]>([
        {
            key: 'key',
            type: 'counter',
        },
    ]);
    const [endgameInputs, setEndgameInputs] = useState<ScoutInputData[]>([
        {
            key: 'key',
            type: 'counter',
        },
    ]);
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState<boolean>(true);
    const [disabled, setDisabled] = useState<boolean>(true);

    const handleSave = () => {
        let autonInputsToSave: any = {};
        autonInputs.forEach((input) => {
            if (input.key && input.type !== 'dropdown')
                autonInputsToSave[input.key] = input.type;
            else if (input.type === 'dropdown')
                autonInputsToSave[input.key] = input.choices;
        });
        let teleopInputsToSave: any = {};
        teleopInputs.forEach((input) => {
            if (input.key && input.type !== 'dropdown')
                teleopInputsToSave[input.key] = input.type;
            else if (input.type === 'dropdown')
                teleopInputsToSave[input.key] = input.choices;
        });
        let endgameInputsToSave: any = {};
        endgameInputs.forEach((input) => {
            if (input.key && input.type !== 'dropdown')
                endgameInputsToSave[input.key] = input.type;
            else if (input.type === 'dropdown')
                endgameInputsToSave[input.key] = input.choices;
        });

        db.collection('years')
            .doc(year + '')
            .collection('scouting')
            .doc('auton')
            .set(autonInputsToSave);

        db.collection('years')
            .doc(year + '')
            .collection('scouting')
            .doc('teleop')
            .set(teleopInputsToSave);

        db.collection('years')
            .doc(year + '')
            .collection('scouting')
            .doc('endgame')
            .set(endgameInputsToSave);
    }

    useEffect(() => {
        const fetchData = async () => {
            if (currentUser) {
                const userRef = await db
                    .collection('users')
                    .doc(currentUser.uid)
                    .get();
                const userData: any = userRef.data();
                const { role } = userData;
                if (role === 'admin') {
                    setDisabled(false);
                }
                const [auatonRef, teleopRef, endgameRef] = await Promise.all([
                    db
                        .collection('years')
                        .doc(`${year}`)
                        .collection('scouting')
                        .doc('auton')
                        .get(),
                    db
                        .collection('years')
                        .doc(`${year}`)
                        .collection('scouting')
                        .doc('teleop')
                        .get(),
                    db
                        .collection('years')
                        .doc(`${year}`)
                        .collection('scouting')
                        .doc('endgame')
                        .get(),
                ]);

                const autonData: any =
                    Object.keys(auatonRef.data() || {}).length === 0
                        ? {
                            key: 'counter',
                        }
                        : auatonRef.data();
                setAutonInputs(
                    Object.keys(autonData).map((key) => {
                        if (Array.isArray(autonData[key]))
                            return {
                                key,
                                type: 'dropdown',
                                choices: autonData[key],
                            };
                        return {
                            key,
                            type: autonData[key],
                        };
                    }),
                );

                const teleopData: any =
                    Object.keys(teleopRef.data() || {}).length === 0
                        ? {
                            key: 'counter',
                        }
                        : teleopRef.data();
                setTeleopInputs(
                    Object.keys(teleopData).map((key) => {
                        if (Array.isArray(teleopData[key]))
                            return {
                                key,
                                type: 'dropdown',
                                choices: teleopData[key].map((key2: any) =>{
                                    return JSON.stringify(key2);
                                })
                            };
                        return {
                            key,
                            type: teleopData[key],
                        };
                    }),
                );

                const endgameData: any =
                    Object.keys(endgameRef.data() || {}).length === 0
                        ? {
                            key: 'counter',
                        }
                        : endgameRef.data();
                setEndgameInputs(
                    Object.keys(endgameData).map((key) => {
                        if (Array.isArray(endgameData[key]))
                            return {
                                key,
                                type: 'dropdown',
                                choices: endgameData[key].map((key2: any) => {
                                    return JSON.stringify(key2);
                                }),
                            };
                        return {
                            key,
                            type: endgameData[key],
                        };
                    }),
                );
            }
        };
        fetchData().then(() => setLoading(false));
    }, [currentUser, year]);

    if (loading)
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

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Box
                bg={'white'}
                borderRadius="lg"
                p={8}
                color={'gray.700'}
                shadow="base"
                width={['100%', '100%', '25%', '25%']}
            >
                <VStack>
                    <Heading textColor={'#550575'}>Match QR Code Data</Heading>
                    <div style={{ width: '100%' }}>
                        <Heading size="sm" textAlign={'left'} textColor={'#550575'}>
                            Auton
                        </Heading>
                        {autonInputs.map((autonInput, index) => (
                            <ScoutInputInput
                                key={index}
                                scoutInput={autonInput}
                                onChange={(scoutInput: ScoutInputData) => {
                                    const newAutonInputs = [...autonInputs];
                                    newAutonInputs[index] = scoutInput;
                                    setAutonInputs(newAutonInputs);
                                }}
                                onDelete={() => {
                                    const newAutonInputs = [...autonInputs];
                                    newAutonInputs.splice(index, 1);
                                    setAutonInputs(newAutonInputs);
                                }}
                                disabled={disabled}
                            />
                        ))}
                        {!disabled && (
                            <IconButton
                                disabled={disabled}
                                icon={<AddIcon />}
                                variant="outline"
                                aria-label="Add Auton Input"
                                onClick={() => {
                                    const newAutonInputs = [...autonInputs];
                                    newAutonInputs.push({
                                        key: '',
                                        type: 'counter',
                                    });
                                    setAutonInputs(newAutonInputs);
                                }}
                                width={'100%'}
                                marginTop={4}
                                colorScheme={'mv-purple'}
                            />
                        )}
                    </div>
                    <div style={{ width: '100%' }}>
                        <Heading size="sm" textAlign={'left'} textColor={'#550575'}>
                            Teleop
                        </Heading>
                        {teleopInputs.map((teleopInput, index) => (
                            <ScoutInputInput
                                disabled={disabled}
                                key={index}
                                scoutInput={teleopInput}
                                onChange={(scoutInput: ScoutInputData) => {
                                    const newTeleopInputs = [...teleopInputs];
                                    newTeleopInputs[index] = scoutInput;
                                    setTeleopInputs(newTeleopInputs);
                                }}
                                onDelete={() => {
                                    const newTeleopInputs = [...teleopInputs];
                                    newTeleopInputs.splice(index, 1);
                                    setTeleopInputs(newTeleopInputs);
                                }}
                            />
                        ))}
                        {!disabled && (
                            <IconButton
                                disabled={disabled}
                                icon={<AddIcon />}
                                variant="outline"
                                aria-label="Add Teleop Input"
                                onClick={() => {
                                    const newTeleopInputs = [...teleopInputs];
                                    newTeleopInputs.push({
                                        key: '',
                                        type: 'counter',
                                    });
                                    setTeleopInputs(newTeleopInputs);
                                }}
                                width={'100%'}
                                marginTop={4}
                                colorScheme={'mv-purple'}
                            />
                        )}
                    </div>
                    <div style={{ width: '100%' }}>
                        <Heading size="sm" textAlign={'left'} textColor={'#550575'}>
                            Endgame
                        </Heading>
                        {endgameInputs.map((endgameInput, index) => (
                            <ScoutInputInput
                                disabled={disabled}
                                key={index}
                                scoutInput={endgameInput}
                                onChange={(scoutInput: ScoutInputData) => {
                                    const newEndgameInputs = [...endgameInputs];
                                    newEndgameInputs[index] = scoutInput;
                                    setEndgameInputs(newEndgameInputs);

                                    console.log(newEndgameInputs);
                                }}
                                onDelete={() => {
                                    const newEndgameInputs = [...endgameInputs];
                                    newEndgameInputs.splice(index, 1);
                                    setEndgameInputs(newEndgameInputs);
                                }}
                            />
                        ))}
                        {!disabled && (
                            <IconButton
                                disabled={disabled}
                                icon={<AddIcon />}
                                variant="outline"
                                aria-label="Add Endgame Input"
                                onClick={() => {
                                    const newEndgameInputs = [...endgameInputs];
                                    newEndgameInputs.push({
                                        key: '',
                                        type: 'counter',
                                    });
                                    setEndgameInputs(newEndgameInputs);
                                }}
                                width={'100%'}
                                marginTop={4}
                                colorScheme={'mv-purple'}
                            />
                        )}
                    </div>
                    {!disabled && (
                        <Button
                            colorScheme={'mv-purple'}
                            disabled={disabled}
                            onClick={handleSave}
                        >
                            Save
                        </Button>
                    )}
                </VStack>
            </Box>
        </div>
    );
};

export default ScoutingInputs;
