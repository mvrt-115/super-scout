import { AddIcon } from '@chakra-ui/icons';
import {
    Box,
    Button,
    Heading,
    IconButton,
    Spinner,
    VStack,
} from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';
import ScoutInputInput from '../components/ScoutInputInput';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';

interface ScoutingInputsProps {}

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

    const serializeField = (input: ScoutInputData): any => {
        if (input.type.startsWith('selection ')) {
            // Convert back to dropdown object: {"Name": ["Opt1", "Opt2"]}
            const opts = input.type.substring('selection '.length).split(',').map(o => o.trim());
            return { [input.key]: opts };
        }
        return `${input.key}:${input.type}`;
    };

    const handleSave = () => {
        const autonInputsToSave = autonInputs.filter(i => i.key).map(serializeField);
        const teleopInputsToSave = teleopInputs.filter(i => i.key).map(serializeField);
        const endgameInputsToSave = endgameInputs.filter(i => i.key).map(serializeField);

        db.collection('years')
            .doc(year + '')
            .collection('scouting')
            .doc('auton')
            .set({ autonFields: autonInputsToSave });

        db.collection('years')
            .doc(year + '')
            .collection('scouting')
            .doc('teleop')
            .set({ teleopFields: teleopInputsToSave });

        db.collection('years')
            .doc(year + '')
            .collection('scouting')
            .doc('endgame')
            .set({ endgameFields: endgameInputsToSave });
    };

    useEffect(() => {
        const fetchData = async () => {
            // Bypass login requirement for now
            setDisabled(false);

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

            const parseFields = (raw: any): ScoutInputData[] => {
                const arr = Object.values(raw || []);
                if (arr.length === 0) return [{ key: 'counter', type: 'counter' }];
                return arr.map((field: any) => {
                    if (typeof field === 'object' && field !== null) {
                        // Dropdown: {"Name": ["Opt1", "Opt2"]}
                        const key = Object.keys(field)[0];
                        const opts = Object.values(field)[0] as string[];
                        return { key, type: `selection ${opts.join(',')}` };
                    }
                    const parts = (field + '').split(':');
                    return { key: parts[0].trim(), type: (parts[1] || 'counter').trim() };
                }) as ScoutInputData[];
            };

            setAutonInputs(parseFields(auatonRef.data()?.autonFields));
            setTeleopInputs(parseFields(teleopRef.data()?.teleopFields));
            setEndgameInputs(parseFields(endgameRef.data()?.endgameFields));
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
                    <Heading textColor={'mv-purple.500'}>Match QR Code Data</Heading>
                    <div style={{ width: '100%' }}>
                        <Heading
                            size="sm"
                            textAlign={'left'}
                            textColor={'mv-purple.500'}
                        >
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
                        <Heading
                            size="sm"
                            textAlign={'left'}
                            textColor={'mv-purple.500'}
                        >
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
                        <Heading
                            size="sm"
                            textAlign={'left'}
                            textColor={'mv-purple.500'}
                        >
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
