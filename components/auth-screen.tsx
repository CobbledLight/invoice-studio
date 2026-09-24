"use client";
import { useState } from 'react';
import { FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field } from './studio-fields';
import { supabase } from '@/lib/supabase';
export function Brand() { return <div className="brand"><span className="brand-icon"><FileText size={21}/></span>invoice<span className="brand-light">studio</span></div>; }
export function AuthScreen({ onDemo, recovery = false, onRecovered }: {
    onDemo: () => void;
    recovery?: boolean;
    onRecovered: () => void;
}) {
    const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login'), [email, setEmail] = useState(''), [password, setPassword] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
    async function submit(e: React.FormEvent) { e.preventDefault(); setError(''); setMessage(''); setBusy(true); try {
        if (!supabase)
            throw Error('Account connection is not configured yet. You can explore the sample workspace below.');
        let result;
        if (recovery) {
            result = await supabase.auth.updateUser({ password });
            if (!result.error) {
                history.replaceState(null, '', location.pathname);
                onRecovered();
            }
        }
        else if (mode === 'signup') {
            result = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: location.origin } });
            if (!result.error)
                setMessage('Check your email to confirm your account, then sign in.');
        }
        else if (mode === 'reset') {
            result = await supabase.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/?recovery=1' });
            if (!result.error)
                setMessage('If an account exists, a password reset link will arrive by email.');
        }
        else
            result = await supabase.auth.signInWithPassword({ email, password });
        if (result?.error)
            throw result.error;
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Unable to sign in. Please retry.');
    }
    finally {
        setBusy(false);
    } }
    function switchMode(m: typeof mode) { setMode(m); setError(''); setMessage(''); }
    return <main className="auth-wrap"><section className="auth-card"><Brand /><h1>{recovery ? 'Choose a new password' : mode === 'signup' ? 'Make room for your work.' : mode === 'reset' ? 'Reset your password' : 'Welcome back.'}</h1><p className="muted">{recovery ? 'Set a secure password to continue.' : mode === 'signup' ? 'Create your private invoice workspace.' : mode === 'reset' ? 'We’ll email you a reset link.' : 'Your invoices, customers and details. All together.'}</p><form onSubmit={submit}>{error && <div role="alert" className="error-message">{error}</div>}{message && <div role="status" className="success-note">{message}</div>}{!recovery && <Field label="Email address" value={email} onChange={setEmail} type="email" required/>}{(recovery || mode !== 'reset') && <Field label="Password" value={password} onChange={setPassword} type="password" required/>}{(mode === 'signup' || recovery) && <p className="inline-help">Use at least 8 characters.</p>}<Button type="submit" className="primary" disabled={busy || ((mode === 'signup' || recovery) && password.length < 8)}>{busy ? 'Please wait…' : recovery ? 'Save password' : mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Sign in'}<ArrowRight size={17}/></Button></form>{!recovery && <><div className="auth-links"><button className="text-button" onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}>{mode === 'login' ? 'Create an account' : 'Back to sign in'}</button>{mode === 'login' && <button className="text-button" onClick={() => switchMode('reset')}>Forgot password?</button>}</div><div style={{ borderTop: '1px solid #e4ebe7', marginTop: 28, paddingTop: 22, textAlign: 'center' }}><button className="text-button" onClick={onDemo}>Explore a sample workspace →</button><p className="inline-help">Sample changes reset when you leave or refresh.</p></div></>}</section></main>;
}
