// Morse Academy — Audio Engine Module
// Web Audio API: Tone generation, WPM & Farnsworth timing, Dot/Dash audio synthesis

class MorseAudioEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.oscillator = null;
        this._isPlaying = false;
        this._timeouts = [];
        this._activeToneStop = null;

        this.volume = 0.7;
        this.frequency = 600;
    }

    init() {
        if (!this.ctx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.ctx = new AudioContextClass();
                this.masterGain = this.ctx.createGain();
                this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
                this.masterGain.connect(this.ctx.destination);
            }
        }

        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }

        // Sync with AppState settings if available
        if (window.AppState) {
            const settings = window.AppState.getSettings();
            if (settings.volume !== undefined) this.volume = settings.volume;
            if (settings.frequency !== undefined) this.frequency = settings.frequency;
        }

        return this.ctx;
    }

    setVolume(v) {
        this.volume = Math.max(0, Math.min(1, v));
    }

    setFrequency(hz) {
        this.frequency = Math.max(100, Math.min(2000, hz));
        if (this.oscillator) {
            try {
                this.oscillator.frequency.setValueAtTime(this.frequency, this.ctx.currentTime);
            } catch (e) {}
        }
    }

    isPlaying() {
        return this._isPlaying;
    }

    stop() {
        this._timeouts.forEach(t => clearTimeout(t));
        this._timeouts = [];

        if (this._activeToneStop) {
            try { this._activeToneStop(); } catch (e) {}
            this._activeToneStop = null;
        }

        if (this.masterGain && this.ctx) {
            try {
                this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
                this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
            } catch (e) {}
        }

        if (this.oscillator) {
            try {
                this.oscillator.stop();
                this.oscillator.disconnect();
            } catch (e) {}
            this.oscillator = null;
        }

        this._isPlaying = false;
    }

    _playTone(durationMs, freq, vol) {
        return new Promise((resolve) => {
            if (!this._isPlaying) {
                resolve();
                return;
            }

            this.init();
            if (!this.ctx) {
                resolve();
                return;
            }

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq || this.frequency, this.ctx.currentTime);

            // 5ms attack/release to eliminate audio clicks
            const attackTime = 0.005;
            const releaseTime = 0.005;
            const durSec = durationMs / 1000;
            const now = this.ctx.currentTime;
            const targetVol = vol !== undefined ? vol : this.volume;

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(targetVol, now + attackTime);
            gain.gain.setValueAtTime(targetVol, Math.max(now + attackTime, now + durSec - releaseTime));
            gain.gain.linearRampToValueAtTime(0, now + durSec);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + durSec);

            let finished = false;
            const cleanup = () => {
                if (finished) return;
                finished = true;
                try {
                    osc.stop();
                    osc.disconnect();
                    gain.disconnect();
                } catch (e) {}
                resolve();
            };

            this._activeToneStop = cleanup;
            const tid = setTimeout(cleanup, durationMs);
            this._timeouts.push(tid);
        });
    }

    _sleep(ms) {
        return new Promise((resolve) => {
            if (!this._isPlaying) {
                resolve();
                return;
            }
            const tid = setTimeout(resolve, ms);
            this._timeouts.push(tid);
        });
    }

    async playMorse(morseStr, options = {}) {
        this.stop();
        this._isPlaying = true;

        const settings = window.AppState ? window.AppState.getSettings() : {};
        const wpm = options.wpm || settings.wpm || 15;
        const fwpm = options.farnsworthWpm || settings.farnsworthWpm || wpm;
        const freq = options.frequency || settings.frequency || this.frequency;
        const vol = options.volume !== undefined ? options.volume : this.volume;

        const engine = window.MorseEngine;
        const dotDur = engine ? engine.dotDuration(wpm) : 1200 / wpm;
        const dashDur = engine ? engine.dashDuration(wpm) : 3 * dotDur;
        const charGap = engine ? engine.charSpace(wpm) : dotDur;
        const letterGap = engine ? engine.letterSpace(wpm, fwpm) : 3 * dotDur;
        const wordGap = engine ? engine.wordSpace(wpm, fwpm) : 7 * dotDur;

        const symbols = morseStr.trim().split('');

        for (let i = 0; i < symbols.length; i++) {
            if (!this._isPlaying) break;
            const sym = symbols[i];

            if (sym === '.') {
                await this._playTone(dotDur, freq, vol);
                await this._sleep(charGap);
            } else if (sym === '-' || sym === '—') {
                await this._playTone(dashDur, freq, vol);
                await this._sleep(charGap);
            } else if (sym === ' ') {
                await this._sleep(letterGap - charGap);
            } else if (sym === '/') {
                await this._sleep(wordGap - charGap);
            }
        }

        this._isPlaying = false;
        if (options.onComplete) {
            options.onComplete();
        }
    }

    async playChar(char, options = {}) {
        if (!char) return;
        const engine = window.MorseEngine;
        const morse = engine ? engine.charToMorse(char) : '';
        if (!morse) return;

        return this.playMorse(morse, options);
    }

    async playSequence(text, options = {}) {
        this.stop();
        this._isPlaying = true;

        const settings = window.AppState ? window.AppState.getSettings() : {};
        const wpm = options.wpm || settings.wpm || 15;
        const fwpm = options.farnsworthWpm || settings.farnsworthWpm || wpm;
        const freq = options.frequency || settings.frequency || this.frequency;
        const vol = options.volume !== undefined ? options.volume : this.volume;

        const engine = window.MorseEngine;
        const dotDur = engine ? engine.dotDuration(wpm) : 1200 / wpm;
        const dashDur = engine ? engine.dashDuration(wpm) : 3 * dotDur;
        const charGap = engine ? engine.charSpace(wpm) : dotDur;
        const letterGap = engine ? engine.letterSpace(wpm, fwpm) : 3 * dotDur;
        const wordGap = engine ? engine.wordSpace(wpm, fwpm) : 7 * dotDur;

        const str = text.toUpperCase();

        for (let i = 0; i < str.length; i++) {
            if (!this._isPlaying) break;
            const ch = str[i];

            if (ch === ' ') {
                await this._sleep(wordGap);
                continue;
            }

            if (options.onChar) {
                options.onChar(ch, i);
            }

            const code = engine ? engine.charToMorse(ch) : '';
            if (code) {
                for (let j = 0; j < code.length; j++) {
                    if (!this._isPlaying) break;
                    const sym = code[j];
                    if (sym === '.') {
                        await this._playTone(dotDur, freq, vol);
                    } else if (sym === '-' || sym === '—') {
                        await this._playTone(dashDur, freq, vol);
                    }
                    if (j < code.length - 1) {
                        await this._sleep(charGap);
                    }
                }
            }

            if (i < str.length - 1 && str[i + 1] !== ' ') {
                await this._sleep(letterGap);
            }
        }

        this._isPlaying = false;
        if (options.onComplete) {
            options.onComplete();
        }
    }
}

export const MorseAudio = new MorseAudioEngine();
if (typeof window !== 'undefined') {
    window.MorseAudio = MorseAudio;
}
