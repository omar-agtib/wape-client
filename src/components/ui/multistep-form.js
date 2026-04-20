import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CheckIcon, ArrowRightIcon } from "lucide-react";
const steps = [
    { id: 1, label: "Name", field: "name", placeholder: "Your full name" },
    { id: 2, label: "Email", field: "email", placeholder: "you@example.com" },
    { id: 3, label: "Goal", field: "goal", placeholder: "What brings you here?" },
];
export function MultiStepForm() {
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState({});
    const [isComplete, setIsComplete] = useState(false);
    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
        else {
            setIsComplete(true);
        }
    };
    const handleInputChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };
    const currentStepData = steps[currentStep];
    const progress = ((currentStep + 1) / steps.length) * 100;
    if (isComplete) {
        return (_jsx("div", { className: "w-full max-w-sm", children: _jsxs("div", { className: "relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-background via-background to-muted/20 p-12 backdrop-blur", children: [_jsx("div", { className: "absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),transparent_50%)]" }), _jsxs("div", { className: "relative flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-700", children: [_jsx("div", { className: "flex h-16 w-16 items-center justify-center rounded-full border-2 border-foreground/10 bg-foreground/5", children: _jsx(CheckIcon, { className: "h-8 w-8 text-foreground animate-in zoom-in duration-500 delay-200", strokeWidth: 2.5 }) }), _jsxs("div", { className: "space-y-1 text-center", children: [_jsx("h2", { className: "text-xl font-medium tracking-tight text-balance", children: "You're all set" }), _jsx("p", { className: "text-sm text-muted-foreground/80", children: formData.name })] })] })] }) }));
    }
    return (_jsxs("div", { className: "w-full max-w-sm", children: [_jsx("div", { className: "mb-10 flex items-center justify-center gap-3", children: steps.map((step, index) => (_jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("button", { onClick: () => index < currentStep && setCurrentStep(index), disabled: index > currentStep, className: cn("group relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-700 ease-out", "disabled:cursor-not-allowed", index < currentStep && "bg-foreground/10 text-foreground/60", index === currentStep &&
                                "bg-foreground text-background shadow-[0_0_20px_-5px_rgba(0,0,0,0.3)]", index > currentStep && "bg-muted/50 text-muted-foreground/40"), children: [index < currentStep ? (_jsx(CheckIcon, { className: "h-4 w-4 animate-in zoom-in duration-500", strokeWidth: 2.5 })) : (_jsx("span", { className: "text-sm font-medium tabular-nums", children: step.id })), index === currentStep && (_jsx("div", { className: "absolute inset-0 rounded-full bg-foreground/20 blur-md animate-pulse" }))] }), index < steps.length - 1 && (_jsxs("div", { className: "relative h-[1.5px] w-12", children: [_jsx("div", { className: "absolute inset-0 bg-[rgba(207,207,207,0.4)]" }), _jsx("div", { className: "absolute inset-0 bg-foreground/30 transition-all duration-700 ease-out origin-left", style: {
                                        transform: `scaleX(${index < currentStep ? 1 : 0})`,
                                    } })] }))] }, step.id))) }), _jsx("div", { className: "mb-8 overflow-hidden rounded-full bg-muted/30 h-[2px]", children: _jsx("div", { className: "h-full bg-gradient-to-r from-foreground/60 to-foreground transition-all duration-1000 ease-out", style: { width: `${progress}%` } }) }), _jsxs("div", { className: "space-y-8", children: [_jsxs("div", { className: "space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700", children: [_jsxs("div", { className: "flex items-baseline justify-between", children: [_jsx(Label, { htmlFor: currentStepData.field, className: "text-lg font-medium tracking-tight", children: currentStepData.label }), _jsxs("span", { className: "text-xs font-medium text-muted-foreground/60 tabular-nums", children: [currentStep + 1, "/", steps.length] })] }), _jsx("div", { className: "relative group", children: _jsx(Input, { id: currentStepData.field, type: currentStepData.field === "email" ? "email" : "text", placeholder: currentStepData.placeholder, value: formData[currentStepData.field] || "", onChange: (e) => handleInputChange(currentStepData.field, e.target.value), autoFocus: true, className: "h-14 text-base transition-all duration-500 border-border/50 focus:border-foreground/20 bg-background/50 backdrop-blur" }) })] }, currentStepData.id), _jsx(Button, { onClick: handleNext, disabled: !formData[currentStepData.field]?.trim(), className: "w-full h-12 group relative transition-all duration-300 hover:shadow-lg hover:shadow-foreground/5", children: _jsxs("span", { className: "flex items-center justify-center gap-2 font-medium", children: [currentStep === steps.length - 1 ? "Complete" : "Continue", _jsx(ArrowRightIcon, { className: "h-4 w-4 transition-transform group-hover:translate-x-0.5 duration-300", strokeWidth: 2 })] }) }), currentStep > 0 && (_jsx("button", { onClick: () => setCurrentStep(currentStep - 1), className: "w-full text-center text-sm text-muted-foreground/60 hover:text-foreground/80 transition-all duration-300", children: "Go back" }))] })] }));
}
