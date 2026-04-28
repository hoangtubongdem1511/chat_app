'use client';

import Button from "@/app/components/button";
import Input from "@/app/components/inputs/input";
import { useCallback, useEffect, useState } from "react";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import AuthSocialButton from "./AuthSocialButton";
import { BsGithub, BsGoogle } from "react-icons/bs";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useJwtAuth } from "@/app/context/JwtAuthContext";

type Variant = 'LOGIN' | 'REGISTER';

const AuthForm = () => {
    const { login, register: registerUser, loginOAuth, status } = useJwtAuth();
    const router = useRouter();
    const [variant, setVariant] = useState<Variant>('LOGIN');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/users');
        }
    }, [status, router]);

    const toggleVariant = useCallback(() => {
        setVariant((current) => current === 'LOGIN' ? 'REGISTER' : 'LOGIN');
    }, []);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FieldValues>({
        defaultValues: { name: '', email: '', password: '' },
    });

    const extractErrorMessage = (err: unknown): string => {
        if (err && typeof err === 'object' && 'response' in err) {
            const resp = (err as { response?: { data?: { message?: string | string[] } } }).response;
            const msg = resp?.data?.message;
            if (Array.isArray(msg) && msg.length) return msg.join('. ');
            if (typeof msg === 'string' && msg.length) return msg;
        }
        return 'Something went wrong. Please try again.';
    };

    const onSubmit: SubmitHandler<FieldValues> = async (data) => {
        setIsLoading(true);
        try {
            if (variant === 'REGISTER') {
                await registerUser(data.name, data.email, data.password);
                toast.success('Account created!');
                router.push('/users');
            } else {
                await login(data.email, data.password);
                toast.success('Logged in!');
                router.push('/users');
            }
        } catch (err) {
            toast.error(extractErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    const socialAction = (action: 'google' | 'github') => {
        loginOAuth(action);
    };

    return (
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
                <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    {variant === 'REGISTER' && (
                        <Input label="Name" id="name" register={register} errors={errors} disabled={isLoading} required="Name is required" />
                    )}
                    <Input label="Email address" id="email" type="email" register={register} errors={errors} disabled={isLoading} required="Email is required" />
                    <Input label="Password" id="password" type="password" register={register} errors={errors} disabled={isLoading} required="Password is required" />
                    <div>
                        <Button type="submit" fullWidth disabled={isLoading}>
                            {variant === 'LOGIN' ? 'Sign in' : 'Register'}
                        </Button>
                    </div>
                </form>
                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-white px-2 text-gray-500">Or continue with</span>
                        </div>
                    </div>
                    <div className="mt-6 flex gap-2">
                        <AuthSocialButton icon={BsGithub} onClick={() => socialAction('github')} />
                        <AuthSocialButton icon={BsGoogle} onClick={() => socialAction('google')} />
                    </div>
                </div>
                <div className="flex gap-2 justify-center text-sm mt-6 px-2 text-gray-500">
                    <div>
                        {variant === 'LOGIN' ? 'New to Messenger?' : 'Already have an account?'}
                    </div>
                    <div onClick={toggleVariant} className="underline cursor-pointer">
                        {variant === 'LOGIN' ? 'Create an account' : 'Login'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthForm;
