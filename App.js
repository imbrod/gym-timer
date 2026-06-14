import React, { useEffect, useRef, useState, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';
import { useKeepAwake } from 'expo-keep-awake';

// Seconds (within each minute) at which a tick should sound.
const TICK1_SECONDS = [41, 42, 43]; // higher pitch
const TICK2_SECONDS = [57, 58, 59]; // lower pitch

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function App() {
  useKeepAwake(); // keep the screen on while the timer is visible

  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);

  // Time bookkeeping (refs so the interval callback always sees fresh values).
  const baseMsRef = useRef(0); // accumulated ms from previous run segments
  const startMsRef = useRef(null); // Date.now() when the current segment started
  const lastSecRef = useRef(-1); // last whole-second we already processed
  const intervalRef = useRef(null);

  const tick1Ref = useRef(null);
  const tick2Ref = useRef(null);

  // Load the two beep sounds once.
  useEffect(() => {
    let mounted = true;
    (async () => {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        staysActiveInBackground: false,
      });
      const t1 = await Audio.Sound.createAsync(require('./assets/tick1.wav'));
      const t2 = await Audio.Sound.createAsync(require('./assets/tick2.wav'));
      if (mounted) {
        tick1Ref.current = t1.sound;
        tick2Ref.current = t2.sound;
      } else {
        t1.sound.unloadAsync();
        t2.sound.unloadAsync();
      }
    })();
    return () => {
      mounted = false;
      tick1Ref.current?.unloadAsync();
      tick2Ref.current?.unloadAsync();
    };
  }, []);

  const playTick = useCallback((soundRef) => {
    const sound = soundRef.current;
    if (sound) {
      // replayAsync restarts from the beginning even if still playing.
      sound.replayAsync().catch(() => {});
    }
  }, []);

  const handleSecond = useCallback(
    (sec) => {
      const inMinute = sec % 60;
      if (TICK1_SECONDS.includes(inMinute)) {
        playTick(tick1Ref);
      } else if (TICK2_SECONDS.includes(inMinute)) {
        playTick(tick2Ref);
      }
    },
    [playTick]
  );

  // Drive the timer while running.
  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      const ms =
        baseMsRef.current +
        (startMsRef.current != null ? Date.now() - startMsRef.current : 0);
      const sec = Math.floor(ms / 1000);
      if (sec !== lastSecRef.current) {
        lastSecRef.current = sec;
        setElapsed(sec);
        if (sec > 0) handleSecond(sec);
      }
    }, 100);
    return () => clearInterval(intervalRef.current);
  }, [running, handleSecond]);

  const togglePause = useCallback(() => {
    setRunning((prev) => {
      if (prev) {
        // pausing: bank the elapsed time
        baseMsRef.current += Date.now() - startMsRef.current;
        startMsRef.current = null;
      } else {
        // resuming / starting
        startMsRef.current = Date.now();
      }
      return !prev;
    });
  }, []);

  const restart = useCallback(() => {
    baseMsRef.current = 0;
    lastSecRef.current = -1;
    startMsRef.current = Date.now();
    setElapsed(0);
    setRunning(true);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <Text style={styles.label}>{running ? 'RUNNING' : elapsed > 0 ? 'PAUSED' : 'READY'}</Text>
      <Text style={styles.time}>{formatTime(elapsed)}</Text>

      <View style={styles.buttonRow}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            styles.restartButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={restart}
        >
          <Text style={styles.buttonText}>Restart</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            running ? styles.pauseButton : styles.startButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={togglePause}
        >
          <Text style={styles.buttonText}>
            {running ? 'Pauza' : elapsed > 0 ? 'Nastavi' : 'Start'}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.hint}>
        Tik na 41–43 s i 57–59 s svake minute
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  label: {
    color: '#64748b',
    fontSize: 18,
    letterSpacing: 4,
    marginBottom: 8,
    fontWeight: '600',
  },
  time: {
    color: '#f8fafc',
    fontSize: 96,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
    marginBottom: 48,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    paddingVertical: 18,
    paddingHorizontal: 36,
    borderRadius: 16,
    minWidth: 140,
    alignItems: 'center',
  },
  restartButton: {
    backgroundColor: '#334155',
  },
  pauseButton: {
    backgroundColor: '#b45309',
  },
  startButton: {
    backgroundColor: '#15803d',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '600',
  },
  hint: {
    color: '#475569',
    fontSize: 14,
    marginTop: 40,
    textAlign: 'center',
  },
});
