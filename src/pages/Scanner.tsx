import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box,
    Button,
    Heading,
    IconButton,
    Spacer,
    Table,
    Tbody,
    Td,
    Tr,
    VStack,
} from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import NeedAccount from './NeedAccount';
import QRScanner from '../components/QRScanner';
import { DeleteIcon } from '@chakra-ui/icons';
import { db } from '../firebase';

interface ScannerProps {}

const Scanner: FC<ScannerProps> = () => {
    const [qrVisible, setQrVisible] = useState<boolean>(false);
    const [data, setData] = useState<any[]>([]);
    const { currentUser } = useAuth();
    const year = new Date().getFullYear();

    useEffect(() => {
        setData(JSON.parse(localStorage.getItem('matches') || '[]'));
    }, []);

    const uploadData = () => {
        data.forEach(async (match) => {
            const teamDoc = await db
                .collection('years')
                .doc(year + '')
                .collection('regionals')
                .doc(match.regional)
                .collection('teams')
                .doc(match.teamNum)
                .get();
            if (!teamDoc.exists) await teamDoc.ref.set({});
            await pushData(match);
            localStorage.setItem('matches', '[]');
        });
    };
    const pushData = async (match: any) => {
        db.collection('years')
            .doc(year + '')
            .collection('scouting')
            .get()
            .then((data) => {
                let autonFields = Object.values(
                    data.docs[0].data().autonFields || {},
                ).map((field: any) => {
                    if (typeof field === 'object') {
                        return Object.keys(field)[0];
                    }
                    return field.split(':')[0].trim();
                });
                let teleopFields = Object.values(
                    data.docs[3].data().teleopFields || {},
                ).map((field: any) => {
                    if (typeof field === 'object') {
                        return Object.keys(field)[0];
                    }
                    return field.split(':')[0].trim();
                });
                let postGameFields = Object.values(
                    data.docs[1].data().endgameFields || {},
                ).map((field: any) => {
                    if (typeof field === 'object') {
                        return Object.keys(field)[0];
                    }
                    return field.split(':')[0].trim();
                });
                const out: any = {};
                match['autonFields'].forEach((field: any, index: number) => {
                    out[autonFields[index]] = field;
                });
                match['teleopFields'].forEach((field: any, index: number) => {
                    out[teleopFields[index]] = field;
                });
                match['postGameFields'].forEach((field: any, index: number) => {
                    out[postGameFields[index]] = field;
                });
                out.matchNum = match.matchNum;
                db.collection('years')
                    .doc(year + '')
                    .collection('regionals')
                    .doc(match.regional)
                    .collection('teams')
                    .doc(match.teamNum)
                    .collection('matches')
                    .doc(match.matchNum)
                    .set(out);
            });
        setData([]);
    };

    const downloadStorageData = () => {
        // Get the "matches" data from local storage
        const matchesData = localStorage.getItem("matches");
      
        if (!matchesData) {
          alert("No data to download.");
          return;
        }
      
        // Create a Blob containing the JSON data
        const blob = new Blob([matchesData], { type: 'application/json' });
      
        // Create a download link and trigger the download
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = 'ScannerDataDownload.json';
        downloadLink.style.display = 'none';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      
        // Clear the "matches" data from local storage
        localStorage.removeItem("matches");
      };
      

    if (!currentUser) return <NeedAccount />;
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
                width={'fit-content'}
                marginTop={'3%'}
            >
                {qrVisible ? (
                    <QRScanner
                        onFind={(val: any) => {
                            const matchData = JSON.parse(val);
                            setQrVisible(false);
                            setData([...data, matchData]);
                            localStorage.setItem(
                                'matches',
                                JSON.stringify([...data, matchData]),
                            );
                        }}
                    />
                ) : (
                    <Button
                        onClick={() => setQrVisible(true)}
                        colorScheme="mv-purple"
                    >
                        Scan Data
                    </Button>
                )}
            </Box>

            <VStack width="25%" marginTop={'3%'}>
                <Heading textColor={'#550575'}>Locally Stored Matches</Heading>
                <Spacer />
                <Button
                    colorScheme="green"
                    onClick={uploadData}
                    disabled={!data.length}
                >
                    Upload Matches
                </Button>
                <Button
                    onClick={downloadStorageData}
                    colorScheme="green"
                    size="md"
                    width={'100%'}
                    marginTop="1"
                >
                    Download Data - (Delete Matches After)
                </Button>
                <Spacer />
                <Accordion allowMultiple width="100%">
                    {data.map((match, index) => (
                        <AccordionItem key={index}>
                            <h2>
                                <AccordionButton>
                                    <Box flex="1" textAlign="left">
                                        Match # {match.matchNum} Team #{' '}
                                        {match.teamNum}{' '}
                                    </Box>

                                    <AccordionIcon />
                                </AccordionButton>
                            </h2>
                            <AccordionPanel>
                                <IconButton
                                    aria-label="delete-data"
                                    icon={<DeleteIcon />}
                                    colorScheme={'red'}
                                    onClick={() => {
                                        const newData = [...data];
                                        newData.splice(index, 1);
                                        localStorage.setItem(
                                            'matches',
                                            JSON.stringify(newData),
                                        );
                                        setData(newData);
                                    }}
                                />
                                <Table>
                                    <Tbody>
                                        {Object.keys(match).map((key) => (
                                            <Tr key={key}>
                                                <Td>{key}</Td>
                                                <Td>{match[key] + ''}</Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            </AccordionPanel>
                        </AccordionItem>
                    ))}
                </Accordion>
            </VStack>
        </div>
    );
};

export default Scanner;
