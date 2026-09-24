import type { Meta, StoryObj } from "@storybook/react";
import { Carousel, CarouselContent, CarouselDots, CarouselItem, CarouselNext, CarouselPrevious } from "./carousel";
import { Card, CardDescription, CardHeader, CardTitle } from "../card/card";

const meta: Meta<typeof Carousel> = {
  title: "Organisms/Carousel",
  component: Carousel,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Carousel>;

const items = ["Spotify Stats", "Kaiju Stocks", "Design System", "Next system"];

export const Default: Story = {
  render: () => (
    <Carousel className="mx-auto w-full max-w-3xl">
      <CarouselContent>
        {items.map((item, index) => (
          <CarouselItem key={item} className="md:basis-1/2">
            <Card className="h-40">
              <CardHeader>
                <CardTitle>{item}</CardTitle>
                <CardDescription>Slide {index + 1}</CardDescription>
              </CardHeader>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="mt-4 flex items-center justify-between">
        <CarouselDots />
        <div className="flex gap-2">
          <CarouselPrevious />
          <CarouselNext />
        </div>
      </div>
    </Carousel>
  ),
};
