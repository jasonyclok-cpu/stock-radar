import { Composition } from "remotion";
import { HelloWorld, helloWorldSchema } from "./HelloWorld";

// Vertical 9:16 format, suitable for TikTok / Reels / Shorts / IG Stories.
const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;
const DURATION_IN_SECONDS = 6;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={DURATION_IN_SECONDS * FPS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        schema={helloWorldSchema}
        defaultProps={{
          title: "Hello Remotion",
          subtitle: "Vertical video, generated with code",
          accentColor: "#4f7cff",
        }}
      />
    </>
  );
};
