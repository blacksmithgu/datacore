import {
    ReactNode,
    RefObject,
    forwardRef,
    useContext,
    createContext,
    memo,
    Context as ReactContext,
    useEffect,
    useRef,
    createPortal,
    ComponentProps,
    ForwardedRef,
    useImperativeHandle,
    useMemo,
} from "preact/compat";
import { App, Modal as ObsidianModal } from "obsidian";
import { APP_CONTEXT } from "ui/markdown";
import { Literal } from "expression/literal";
import { VNode } from "preact";

class DatacoreModal extends ObsidianModal {
    constructor(app: App, public openCallback?: ObsidianModal["onOpen"], public onCancel?: ObsidianModal["onClose"]) {
        super(app);
    }
    public onOpen() {
        super.onOpen();
        this.openCallback?.();
    }
    public onClose() {
        super.onClose();
        this.onCancel?.();
    }
}

class SubmittableDatacoreModal<T> extends DatacoreModal {
    constructor(
        app: App,
        public submitCallback?: (result: T) => void | Promise<void>,
        public openCallback?: ObsidianModal["onOpen"],
        public onCancel?: ObsidianModal["onClose"]
    ) {
        super(app, openCallback, onCancel);
    }
    public onSubmit(result: T) {
        this.close();
        this.submitCallback?.(result);
    }
}

export class Modals {
    get submittableModal() {
        return SubmittableDatacoreModal;
    }
    get modal() {
        return DatacoreModal;
    }
}

interface ModalContextType<M extends ObsidianModal> {
    modal: M;
}

interface BaseModalProps {
    title?: Literal | VNode | ReactNode;
    children: ReactNode;
    onCancel?: ObsidianModal["onClose"];
    onOpen?: ObsidianModal["onOpen"];
}

const MODAL_CONTEXT = createContext<ModalContextType<any> | null>(null);

function ModalContext<M extends ObsidianModal>({ modal, children }: { modal: M; children: ReactNode }) {
    const Ctx = MODAL_CONTEXT as ReactContext<ModalContextType<M>>;
    return <Ctx.Provider value={{ modal }}>{children}</Ctx.Provider>;
}

function useReusableImperativeHandle<M extends ObsidianModal>(modal: M, ref: ForwardedRef<M>) {
    useImperativeHandle(ref, () => modal, [modal]);
}

function InnerSubmittableModal<T>(
    {
        children,
        onSubmit,
        onCancel,
        onOpen,
        title,
    }: BaseModalProps & {
        onSubmit?: (result: T) => void | Promise<void>;
    },
    ref: ForwardedRef<SubmittableDatacoreModal<T>>
) {
    const app = useContext(APP_CONTEXT)!;
    const modal = useMemo(
        () => new SubmittableDatacoreModal<T>(app, onSubmit, onOpen, onCancel),
        [app, onSubmit, onOpen, onCancel]
    );
    useReusableImperativeHandle(modal, ref);
    return (
        <ModalContext modal={modal}>
            {createPortal(<>{title}</>, modal.titleEl)}
            {createPortal(<>{children}</>, modal.contentEl)}
        </ModalContext>
    );
}

function InnerModal({ children, onCancel, onOpen, title }: BaseModalProps, ref: ForwardedRef<DatacoreModal>) {
    const app = useContext(APP_CONTEXT)!;
    const modal = useMemo(() => new DatacoreModal(app, onOpen, onCancel), [app, onOpen, onCancel]);
    useReusableImperativeHandle(modal, ref);
    return (
        <ModalContext modal={modal}>
            {createPortal(<>{title}</>, modal.titleEl)}
            {createPortal(<>{children}</>, modal.contentEl)}
        </ModalContext>
    );
}

export function useModalContext<M extends ObsidianModal>() {
    return useContext(MODAL_CONTEXT) as ModalContextType<M>;
}

export const SubmittableModal = forwardRef(InnerSubmittableModal) as typeof InnerSubmittableModal;

export const Modal = forwardRef(InnerModal) as typeof InnerModal;
