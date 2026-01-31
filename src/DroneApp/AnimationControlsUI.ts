import { Scene } from "@babylonjs/core";
import { AdvancedDynamicTexture, Control, Slider, TextBlock, Rectangle, Button } from "@babylonjs/gui";

export class AnimationControlsUI {
    private scene: Scene;
    private adt: AdvancedDynamicTexture;

    private timeSlider!: Slider;
    private timeLabel!: TextBlock;
    private playPauseButton!: Button;
    private resetButton!: Button;

    private totalDuration = 0;
    private isScrubbing = false;

    public onTimeChanged?: (newTime: number) => void;

    public onPlayPauseToggled?: (isPlaying: boolean) => void;

    public onReset?: () => void;

    constructor(scene: Scene, totalDuration: number) {
        this.scene = scene;
        this.totalDuration = totalDuration;

        this.adt = AdvancedDynamicTexture.CreateFullscreenUI("AnimationControlsUI", true, this.scene);

        this.createUI();
        this.setPlayState(false);
    }

    private createUI() {
        const controlBar = new Rectangle();
        controlBar.width = "100%";
        controlBar.height = "120px";
        controlBar.thickness = 0;
        controlBar.background = "rgba(0,0,0,0.65)";
        controlBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.adt.addControl(controlBar);

        // Slider timeline
        this.timeSlider = new Slider();
        this.timeSlider.minimum = 0;
        this.timeSlider.maximum = this.totalDuration;
        this.timeSlider.value = 0;
        this.timeSlider.height = "30px";
        this.timeSlider.width = "70%";
        this.timeSlider.top = "-40px";
        this.timeSlider.color = "white";
        this.timeSlider.background = "#444";
        this.timeSlider.isThumbClamped = true;
        controlBar.addControl(this.timeSlider);

        // Label temps (mm:ss / total)
        this.timeLabel = new TextBlock();
        this.timeLabel.text = "0:00 / 0:00";
        this.timeLabel.color = "white";
        this.timeLabel.fontSize = 22;
        this.timeLabel.top = "-75px";
        this.timeLabel.height = "40px";
        controlBar.addControl(this.timeLabel);

        // Bouton Play/Pause
        this.playPauseButton = Button.CreateSimpleButton("playPause", "Pause");
        this.playPauseButton.width = "140px";
        this.playPauseButton.height = "55px";
        this.playPauseButton.color = "white";
        this.playPauseButton.background = "#0066cc";
        this.playPauseButton.left = "-220px";
        this.playPauseButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        controlBar.addControl(this.playPauseButton);

        this.playPauseButton.onPointerUpObservable.add(() => {
        const isCurrentlyPlaying = this.playPauseButton.textBlock?.text === "Pause";
        const wantPlaying = !isCurrentlyPlaying;
        if (this.playPauseButton.textBlock) {
            this.playPauseButton.textBlock.text = wantPlaying ? "Pause" : "Play";
        }

        // On notifie la scène principale du nouvel état
        if (this.onPlayPauseToggled) {
            this.onPlayPauseToggled(wantPlaying);
        }
});

        // Bouton Reset
        this.resetButton = Button.CreateSimpleButton("reset", "Reset");
        this.resetButton.width = "140px";
        this.resetButton.height = "55px";
        this.resetButton.color = "white";
        this.resetButton.background = "#cc6600";
        this.resetButton.left = "220px";
        this.resetButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        controlBar.addControl(this.resetButton);

        this.resetButton.onPointerUpObservable.add(() => {
            if (this.onReset) this.onReset();
        });

        this.timeSlider.onPointerDownObservable.add(() => {
            this.isScrubbing = true;
            this.playPauseButton.textBlock!.text = "Play";
            if (this.onPlayPauseToggled) this.onPlayPauseToggled(false);
        });

        this.timeSlider.onPointerUpObservable.add(() => {
            this.isScrubbing = false;
        });

        this.timeSlider.onValueChangedObservable.add((value) => {
            if (this.isScrubbing && this.onTimeChanged) {
                this.onTimeChanged(value);
            }
            this.updateTimeLabel(value);
        });
    }

    public updateTime(currentTime: number) {
        if (!this.isScrubbing) {
            this.timeSlider.value = currentTime;
        }
        this.updateTimeLabel(currentTime);
    }

    private updateTimeLabel(time: number) {
        const format = (sec: number) => {
            const m = Math.floor(sec / 60);
            const s = Math.floor(sec % 60);
            return `${m}:${s.toString().padStart(2, "0")}`;
        };
        this.timeLabel.text = `${format(time)} / ${format(this.totalDuration)}`;
    }

    public setPlayState(isPlaying: boolean) {
        this.playPauseButton.textBlock!.text = isPlaying ? "Pause" : "Play";
    }

    public resetUI() {
        this.timeSlider.value = 0;
        this.updateTimeLabel(0);
        this.setPlayState(true);
    }

    public dispose() {
        this.adt.dispose();
    }
}