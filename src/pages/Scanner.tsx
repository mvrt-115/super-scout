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
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel
} from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';
import QRScanner from '../components/QRScanner';
import { DeleteIcon } from '@chakra-ui/icons';
import { db } from '../firebase';
import QRCodeGenerator from './QRCodeGenerator';

interface ScannerProps {}

const Scanner: FC<ScannerProps> = () => {
    const [qrVisible, setQrVisible] = useState<boolean>(false);
    const [data, setData] = useState<any[]>([]);
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
        const extractFieldName = (field: any): string => {
            if (typeof field === 'object' && field !== null) {
                return Object.keys(field)[0].trim();
            }
            return (field + '').split(':')[0].trim();
        };

        const scoutingBase = db
            .collection('years')
            .doc(year + '')
            .collection('scouting');

        const [autonDoc, teleopDoc, endgameDoc] = await Promise.all([
            scoutingBase.doc('auton').get(),
            scoutingBase.doc('teleop').get(),
            scoutingBase.doc('endgame').get(),
        ]);

        let autonFields = Object.values(autonDoc.data()?.autonFields || {}).map(extractFieldName);
        let teleopFields = Object.values(teleopDoc.data()?.teleopFields || {}).map(extractFieldName);
        let postGameFields = Object.values(endgameDoc.data()?.endgameFields || {}).map(extractFieldName);

        const out: any = {};
        match['autonFields'].forEach((field: any, index: number) => {
            if (autonFields[index]) out[autonFields[index]] = field;
        });
        match['teleopFields'].forEach((field: any, index: number) => {
            if (teleopFields[index]) out[teleopFields[index]] = field;
        });
        match['postGameFields'].forEach((field: any, index: number) => {
            if (postGameFields[index]) out[postGameFields[index]] = field;
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
    
    return (
        <Box p={4} width="100%">
            <Tabs variant="enclosed" colorScheme="mv-purple" align="center" isFitted>
                <TabList mb="1em" maxW="800px" mx="auto">
                    <Tab fontWeight="bold">Scan Match Data</Tab>
                    <Tab fontWeight="bold">Generate Match QR</Tab>
                </TabList>
                <TabPanels>
                    <TabPanel>
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

                            <VStack width={['90%', '70%', '50%', '35%']} marginTop={'3%'}>
                                <Heading textColor={'mv-purple.500'} size="lg">Locally Stored Matches</Heading>
                                <Spacer />
                                <Button
                                    colorScheme="green"
                                    onClick={uploadData}
                                    disabled={!data.length}
                                    width="100%"
                                >
                                    Upload Matches
                                </Button>
                                <Button
                                    onClick={downloadStorageData}
                                    colorScheme="green"
                                    size="md"
                                    width="100%"
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
                                                    <Box flex="1" textAlign="left" fontWeight="bold">
                                                        Match # {match.matchNum} | Team # {match.teamNum}
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
                                                    mb={4}
                                                />
                                                <Table size="sm">
                                                    <Tbody>
                                                        {Object.keys(match).map((key) => (
                                                            <Tr key={key}>
                                                                <Td fontWeight="semibold">{key}</Td>
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
                    </TabPanel>
                    <TabPanel>
                        <QRCodeGenerator />
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Box>
    );
};

export default Scanner;
