import { FC } from "react";
import { Text } from "@chakra-ui/react";

interface PitScoutProps {
    data: any[];
}

const PitScoutData: FC<PitScoutProps> = ({data}) => {
    if (Object.keys(data).length === 0) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Text style={{ fontWeight: 'bolder' }}>
                    No pit scouting data available.
                </Text>
            </div>
        );
    }
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
            }}
        >
            {Object.keys(data).map((field: any) => {
                return (
                    <Text
                        style={{
                            marginTop: '1rem',
                        }}
                    >
                        {`${field}: ${data[field]}`}
                    </Text>
                );
            })}
        </div>
    );
}

export default PitScoutData;