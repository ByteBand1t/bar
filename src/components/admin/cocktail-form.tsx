"use client";

import { useEffect, useCallback } from "react";
import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, X, GripVertical, Loader2, Save, ChevronUp, ChevronDown } from "lucide-react";
import { ImageUpload } from "@/components/image-upload";
import { CocktailSchema, type CocktailInput } from "@/lib/cocktail-schema";
import { CocktailCard } from "@/components/cocktail-card";

const CATEGORIES = ["Cocktail", "Longdrink", "Softdrink", "Bier", "Wein", "Shot"] as const;

interface CocktailFormProps {
  id?: string;
  defaultValues?: Partial<CocktailInput & { imageFilename?: string | null; imageWidth?: number | null; imageHeight?: number | null }>;
}

function SortableIngredientRow({
  id,
  index,
  register,
  errors,
  onRemove,
  canRemove,
  onMoveUp,
  onMoveDown,
}: {
  id: string;
  index: number;
  register: ReturnType<typeof useForm<CocktailInput>>["register"];
  errors: ReturnType<typeof useForm<CocktailInput>>["formState"]["errors"];
  onRemove: () => void;
  canRemove: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="flex gap-2 items-start">
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="mt-2 p-1 text-admin-muted hover:text-accent cursor-grab active:cursor-grabbing hidden sm:block"
      >
        <GripVertical size={16} />
      </button>
      <div className="flex sm:hidden flex-col gap-0.5 mt-1">
        <button type="button" onClick={onMoveUp} className="p-0.5 text-admin-muted hover:text-accent">
          <ChevronUp size={14} />
        </button>
        <button type="button" onClick={onMoveDown} className="p-0.5 text-admin-muted hover:text-accent">
          <ChevronDown size={14} />
        </button>
      </div>
      <div className="flex-1 grid grid-cols-5 gap-2">
        <div className="col-span-3">
          <input
            {...register(`ingredients.${index}.name`)}
            placeholder="Zutat"
            className={inputClass(!!errors.ingredients?.[index]?.name)}
          />
          {errors.ingredients?.[index]?.name && (
            <p className="text-red-400 text-xs mt-1">{errors.ingredients[index]?.name?.message}</p>
          )}
        </div>
        <div className="col-span-2">
          <input
            {...register(`ingredients.${index}.amount`)}
            placeholder="Menge (z.B. 4 cl)"
            className={inputClass(false)}
          />
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        className="mt-2 p-1 text-red-500 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <X size={16} />
      </button>
    </div>
  );
}

function SortableStepRow({
  id,
  index,
  register,
  errors,
  onRemove,
  canRemove,
  onMoveUp,
  onMoveDown,
}: {
  id: string;
  index: number;
  register: ReturnType<typeof useForm<CocktailInput>>["register"];
  errors: ReturnType<typeof useForm<CocktailInput>>["formState"]["errors"];
  onRemove: () => void;
  canRemove: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="flex gap-2 items-start">
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="mt-2 p-1 text-admin-muted hover:text-accent cursor-grab active:cursor-grabbing hidden sm:block"
      >
        <GripVertical size={16} />
      </button>
      <div className="flex sm:hidden flex-col gap-0.5 mt-1">
        <button type="button" onClick={onMoveUp} className="p-0.5 text-admin-muted hover:text-accent">
          <ChevronUp size={14} />
        </button>
        <button type="button" onClick={onMoveDown} className="p-0.5 text-admin-muted hover:text-accent">
          <ChevronDown size={14} />
        </button>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-admin-muted font-mono">#{index + 1}</span>
        </div>
        <textarea
          {...register(`steps.${index}`)}
          rows={2}
          placeholder="Schritt beschreiben…"
          className={`${inputClass(!!errors.steps?.[index])} resize-none`}
        />
        {errors.steps?.[index] && (
          <p className="text-red-400 text-xs mt-1">{(errors.steps[index] as { message?: string })?.message}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        className="mt-8 p-1 text-red-500 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <X size={16} />
      </button>
    </div>
  );
}

function inputClass(hasError: boolean) {
  return `w-full px-3 py-2 bg-admin-surface border rounded-xl text-admin-ink text-sm placeholder-admin-muted focus:outline-none focus:ring-2 transition-colors shadow-sm ${
    hasError
      ? "border-red-500 focus:ring-red-500/20"
      : "border-admin-border focus:ring-accent/20 focus:border-accent/50"
  }`;
}

function labelClass() {
  return "block text-sm font-semibold text-admin-ink mb-1";
}

export function CocktailForm({ id, defaultValues }: CocktailFormProps) {
  const router = useRouter();
  const isEdit = !!id;

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<CocktailInput>({
    resolver: zodResolver(CocktailSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      category: defaultValues?.category ?? "Cocktail",
      description: defaultValues?.description ?? "",
      imageFilename: defaultValues?.imageFilename ?? null,
      imageWidth: defaultValues?.imageWidth ?? null,
      imageHeight: defaultValues?.imageHeight ?? null,
      isAlcoholFree: defaultValues?.isAlcoholFree ?? false,
      isAvailable: defaultValues?.isAvailable ?? true,
      prepTimeMin: defaultValues?.prepTimeMin ?? null,
      ingredients: defaultValues?.ingredients ?? [{ name: "", amount: "" }],
      steps: defaultValues?.steps ?? [""],
    },
  });

  const {
    fields: ingredientFields,
    append: appendIngredient,
    remove: removeIngredient,
    move: moveIngredient,
  } = useFieldArray({ control, name: "ingredients" });

  const {
    fields: stepFields,
    append: appendStep,
    remove: removeStep,
    move: moveStep,
  } = useFieldArray({ control, name: "steps" as never });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const watchedValues = useWatch({ control });

  const submitData = useCallback(
    async (data: CocktailInput, saveAndContinue: boolean) => {
      const url = isEdit ? `/api/admin/cocktails/${id}` : "/api/admin/cocktails";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error ?? "Speichern fehlgeschlagen");
        return;
      }

      const saved = await res.json();
      toast.success(isEdit ? "Gespeichert" : "Cocktail erstellt");

      if (saveAndContinue && !isEdit) {
        router.push(`/admin/cocktails/${saved.id}`);
      } else if (!saveAndContinue) {
        router.push("/admin");
      }
    },
    [id, isEdit, router]
  );

  const onSubmit = useCallback(
    (data: CocktailInput) => submitData(data, false),
    [submitData]
  );

  const onSubmitAndContinue = useCallback(
    (data: CocktailInput) => submitData(data, true),
    [submitData]
  );

  // Cmd/Ctrl+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSubmit(onSubmit)();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSubmit, onSubmit]);

  const handleCancel = () => {
    if (isDirty) {
      if (!confirm("Änderungen verwerfen?")) return;
    }
    router.push("/admin");
  };

  const handleIngredientDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = ingredientFields.findIndex((f) => f.id === active.id);
      const newIndex = ingredientFields.findIndex((f) => f.id === over.id);
      moveIngredient(oldIndex, newIndex);
    }
  };

  const handleStepDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = stepFields.findIndex((f) => f.id === active.id);
      const newIndex = stepFields.findIndex((f) => f.id === over.id);
      moveStep(oldIndex, newIndex);
    }
  };

  const imageValue = watchedValues.imageFilename
    ? {
        filename: watchedValues.imageFilename,
        width: watchedValues.imageWidth ?? null,
        height: watchedValues.imageHeight ?? null,
      }
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Form */}
      <div className="lg:col-span-2 space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-3xl border border-admin-border bg-admin-surface p-5 shadow-sm">
          {/* Name + Kategorie */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass()}>Name *</label>
              <input {...register("name")} className={inputClass(!!errors.name)} placeholder="Mojito" />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className={labelClass()}>Kategorie *</label>
              <select {...register("category")} className={inputClass(!!errors.category)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-admin-surface">
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Beschreibung */}
          <div>
            <label className={labelClass()}>Beschreibung *</label>
            <textarea
              {...register("description")}
              rows={3}
              className={`${inputClass(!!errors.description)} resize-none`}
              placeholder="Frisch, fruchtig, mit einem Hauch von…"
            />
            {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
          </div>

          {/* Bild */}
          <div>
            <label className={labelClass()}>Bild</label>
            <ImageUpload
              value={imageValue}
              onChange={(result) => {
                setValue("imageFilename", result?.filename ?? null, { shouldDirty: true });
                setValue("imageWidth", result?.width ?? null);
                setValue("imageHeight", result?.height ?? null);
              }}
            />
          </div>

          {/* Optionen */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass()}>Zubereitung (Min)</label>
              <input
                type="number"
                min={1}
                max={30}
                {...register("prepTimeMin", { valueAsNumber: true, setValueAs: (v) => (v === "" || isNaN(Number(v)) ? null : Number(v)) })}
                className={inputClass(!!errors.prepTimeMin)}
                placeholder="5"
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Controller
                control={control}
                name="isAlcoholFree"
                render={({ field }) => (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="w-4 h-4 accent-accent"
                    />
                    <span className="text-sm text-admin-muted">Alkoholfrei</span>
                  </label>
                )}
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Controller
                control={control}
                name="isAvailable"
                render={({ field }) => (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="w-4 h-4 accent-accent"
                    />
                    <span className="text-sm text-admin-muted">Verfügbar</span>
                  </label>
                )}
              />
            </div>
          </div>

          {/* Zutaten */}
          <div>
            <label className={labelClass()}>Zutaten *</label>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleIngredientDragEnd}
            >
              <SortableContext
                items={ingredientFields.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {ingredientFields.map((field, index) => (
                    <SortableIngredientRow
                      key={field.id}
                      id={field.id}
                      index={index}
                      register={register}
                      errors={errors}
                      onRemove={() => removeIngredient(index)}
                      canRemove={ingredientFields.length > 1}
                      onMoveUp={() => index > 0 && moveIngredient(index, index - 1)}
                      onMoveDown={() => index < ingredientFields.length - 1 && moveIngredient(index, index + 1)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            {errors.ingredients?.root && (
              <p className="text-red-400 text-xs mt-1">{errors.ingredients.root.message}</p>
            )}
            <button
              type="button"
              onClick={() => appendIngredient({ name: "", amount: "" })}
              className="mt-2 flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover transition-colors"
            >
              <Plus size={16} />
              Zutat hinzufügen
            </button>
          </div>

          {/* Schritte */}
          <div>
            <label className={labelClass()}>Zubereitung *</label>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleStepDragEnd}
            >
              <SortableContext
                items={stepFields.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {stepFields.map((field, index) => (
                    <SortableStepRow
                      key={field.id}
                      id={field.id}
                      index={index}
                      register={register}
                      errors={errors}
                      onRemove={() => removeStep(index)}
                      canRemove={stepFields.length > 1}
                      onMoveUp={() => index > 0 && moveStep(index, index - 1)}
                      onMoveDown={() => index < stepFields.length - 1 && moveStep(index, index + 1)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            {errors.steps?.root && (
              <p className="text-red-400 text-xs mt-1">{errors.steps.root.message}</p>
            )}
            <button
              type="button"
              onClick={() => appendStep("" as never)}
              className="mt-2 flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover transition-colors"
            >
              <Plus size={16} />
              Schritt hinzufügen
            </button>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2 border-t border-admin-border">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-accent-fg shadow-sm font-semibold rounded-lg transition-colors"
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Speichern
              {isDirty && <span className="w-2 h-2 rounded-full bg-orange-500 ml-1" />}
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit(onSubmitAndContinue)()}
              className="flex items-center gap-2 px-5 py-2.5 bg-admin-surface hover:bg-accent-soft disabled:opacity-50 text-admin-ink font-medium rounded-lg transition-colors border border-admin-border"
            >
              Speichern & weiter bearbeiten
            </button>

            <button
              type="button"
              onClick={handleCancel}
              className="px-5 py-2.5 text-admin-muted hover:text-admin-ink transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </form>
      </div>

      {/* Preview Panel (desktop only) */}
      <div className="hidden lg:block">
        <div className="sticky top-6">
          <p className="text-xs text-admin-muted mb-3 uppercase tracking-wide font-medium">Vorschau</p>
          <div className="pointer-events-none">
            <CocktailCard
              cocktail={{
                id: id ?? "preview",
                name: watchedValues.name || "Cocktail-Name",
                description: watchedValues.description || "Beschreibung erscheint hier…",
                imageFilename: watchedValues.imageFilename ?? null,
                category: watchedValues.category || "Cocktail",
                isAlcoholFree: watchedValues.isAlcoholFree ?? false,
                isAvailable: watchedValues.isAvailable ?? true,
                ingredients: (watchedValues.ingredients ?? [])
                  .filter((i): i is { name: string; amount: string } => !!i.name)
                  .map((i) => ({ name: i.name!, amount: i.amount ?? "" })),
                steps: (watchedValues.steps ?? []).filter((s): s is string => typeof s === "string" && s.length > 0),
                prepTimeMin: watchedValues.prepTimeMin ?? null,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
