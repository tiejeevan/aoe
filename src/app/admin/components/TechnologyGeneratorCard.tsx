'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { WandSparkles, LoaderCircle } from 'lucide-react';

interface TechnologyGeneratorCardProps {
    theme: string;
    onThemeChange: (theme: string) => void;
    onGenerate: () => void;
    isGenerating: boolean;
}

const TechnologyGeneratorCard: React.FC<TechnologyGeneratorCardProps> = ({
    theme,
    onThemeChange,
    onGenerate,
    isGenerating,
}) => {
    return (
        <Card className="bg-stone-dark/20 border-stone-light/20">
            <CardHeader>
                <CardTitle className="text-base font-serif">Technology Generator</CardTitle>
                <CardDescription className="text-parchment-dark">Generate a single new technology based on a theme.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-end gap-4">
                <div className="flex-grow">
                    <Label htmlFor="dge-tech-theme">Theme</Label>
                    <Input
                        id="dge-tech-theme"
                        type="text"
                        value={theme}
                        onChange={(e) => onThemeChange(e.target.value)}
                        placeholder="e.g., Naval Combat"
                        className="sci-fi-input"
                        disabled={isGenerating}
                    />
                </div>
                <Button onClick={onGenerate} disabled={isGenerating}>
                    {isGenerating ? <LoaderCircle className="mr-2 animate-spin" /> : <WandSparkles className="mr-2" />}
                    {isGenerating ? 'Generating...' : 'Generate'}
                </Button>
            </CardContent>
        </Card>
    );
};

export default TechnologyGeneratorCard;
