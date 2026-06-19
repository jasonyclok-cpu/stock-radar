// Remotion configuration. See https://www.remotion.dev/docs/config
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// H.264 with a reasonable CRF for good quality / size balance.
Config.setCodec("h264");
Config.setCrf(18);
