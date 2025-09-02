# TanStack Form Reference (Project Standard)

TanStack Form is a headless form library that provides powerful form state management with first-class TypeScript support. This project uses it as the standard for all form implementations.

## Key Features

- **First-Class TypeScript Support**: Full type safety throughout
- **Headless Design**: 100% control over markup and styling
- **Granularly Reactive**: Updates only relevant components
- **Zero Dependencies**: Lightweight and fast
- **Framework Agnostic**: Works with React, Vue, Angular, and others
- **Advanced Validation**: Sync/async validation with configurable triggers

## Installation & Setup

```bash
npm install @tanstack/react-form
```

## Basic Form Implementation

### 1. Simple Form with Validation

```typescript
import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { z } from 'zod';

const organizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  slug: z.string().min(3, 'Slug must be at least 3 characters'),
  description: z.string().optional(),
});

export function CreateOrganizationForm() {
  const form = useForm({
    defaultValues: {
      name: '',
      slug: '',
      description: '',
    },
    validatorAdapter: zodValidator,
    validators: {
      onChange: organizationSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await createOrganization(value);
        toast.success('Organization created successfully!');
        router.push('/dashboard/organizations');
      } catch (error) {
        toast.error('Failed to create organization');
      }
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Organization</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field
            name="name"
            children={(field) => (
              <div>
                <Label htmlFor={field.name}>Organization Name</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-red-600 mt-1">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          />

          <form.Field
            name="slug"
            children={(field) => (
              <div>
                <Label htmlFor={field.name}>Slug</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="organization-slug"
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-red-600 mt-1">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          />

          <form.Field
            name="description"
            children={(field) => (
              <div>
                <Label htmlFor={field.name}>Description (Optional)</Label>
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!form.state.canSubmit || form.state.isSubmitting}
            >
              {form.state.isSubmitting ? 'Creating...' : 'Create Organization'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

### 2. Complex Form with Nested Fields

```typescript
import { useFieldArray } from '@tanstack/react-form';

const memberSchema = z.object({
  members: z.array(z.object({
    email: z.string().email('Invalid email'),
    role: z.enum(['owner', 'admin', 'member']),
    teamId: z.string().optional(),
  })).min(1, 'At least one member is required'),
});

export function InviteMembersForm() {
  const form = useForm({
    defaultValues: {
      members: [
        { email: '', role: 'member' as const, teamId: '' }
      ],
    },
    validatorAdapter: zodValidator,
    validators: {
      onChange: memberSchema,
    },
    onSubmit: async ({ value }) => {
      for (const member of value.members) {
        await inviteMember(member);
      }
      toast.success('Invitations sent!');
    },
  });

  return (
    <form onSubmit={form.handleSubmit} className="space-y-6">
      <form.Field
        name="members"
        mode="array"
        children={(field) => (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Team Members</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => field.pushValue({ email: '', role: 'member', teamId: '' })}
              >
                Add Member
              </Button>
            </div>

            {field.state.value.map((_, index) => (
              <Card key={index} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <form.Field
                    name={`members.${index}.email`}
                    children={(subField) => (
                      <div>
                        <Label>Email</Label>
                        <Input
                          value={subField.state.value}
                          onChange={(e) => subField.handleChange(e.target.value)}
                          onBlur={subField.handleBlur}
                          placeholder="member@example.com"
                        />
                        {subField.state.meta.errors.length > 0 && (
                          <p className="text-sm text-red-600 mt-1">
                            {subField.state.meta.errors[0]}
                          </p>
                        )}
                      </div>
                    )}
                  />

                  <form.Field
                    name={`members.${index}.role`}
                    children={(subField) => (
                      <div>
                        <Label>Role</Label>
                        <Select
                          value={subField.state.value}
                          onValueChange={subField.handleChange}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="owner">Owner</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  />

                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => field.removeValue(index)}
                      disabled={field.state.value.length === 1}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      />

      <Button
        type="submit"
        disabled={!form.state.canSubmit || form.state.isSubmitting}
        className="w-full"
      >
        {form.state.isSubmitting ? 'Sending Invitations...' : 'Send Invitations'}
      </Button>
    </form>
  );
}
```

## Advanced Patterns

### 1. Async Validation

```typescript
const form = useForm({
  defaultValues: { slug: '' },
  validators: {
    onChangeAsync: z.object({
      slug: z.string().refine(async (slug) => {
        if (!slug) return true;
        const isAvailable = await checkSlugAvailability(slug);
        return isAvailable;
      }, 'This slug is already taken'),
    }),
    onChangeAsyncDebounceMs: 500,
  },
});
```

### 2. Custom Field Components

```typescript
interface FormFieldProps {
  label: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FormField({ label, description, required, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

// Usage
<form.Field
  name="email"
  children={(field) => (
    <FormField
      label="Email Address"
      description="We'll use this to send you important updates"
      required
    >
      <Input
        type="email"
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
      />
      <FieldErrors field={field} />
    </FormField>
  )}
/>
```

### 3. Form State Management

```typescript
export function useFormPersistence(formId: string) {
  const saveFormData = (data: any) => {
    localStorage.setItem(`form-${formId}`, JSON.stringify(data));
  };

  const loadFormData = () => {
    const saved = localStorage.getItem(`form-${formId}`);
    return saved ? JSON.parse(saved) : null;
  };

  const clearFormData = () => {
    localStorage.removeItem(`form-${formId}`);
  };

  return { saveFormData, loadFormData, clearFormData };
}

export function PersistentForm() {
  const { saveFormData, loadFormData, clearFormData } = useFormPersistence('create-org');

  const form = useForm({
    defaultValues: loadFormData() || { name: '', slug: '' },
    onSubmit: async ({ value }) => {
      await createOrganization(value);
      clearFormData(); // Clear after successful submission
    },
  });

  // Auto-save form data
  useEffect(() => {
    const subscription = form.store.subscribe(() => {
      saveFormData(form.state.values);
    });
    return subscription;
  }, [form, saveFormData]);

  // ... rest of form
}
```

### 4. Multi-Step Forms

```typescript
export function MultiStepForm() {
  const [currentStep, setCurrentStep] = useState(0);
  
  const form = useForm({
    defaultValues: {
      // Step 1: Organization details
      name: '',
      slug: '',
      description: '',
      // Step 2: Team setup
      members: [],
      // Step 3: Settings
      settings: {
        isPublic: false,
        allowInvites: true,
      },
    },
  });

  const steps = [
    {
      title: 'Organization Details',
      fields: ['name', 'slug', 'description'],
    },
    {
      title: 'Team Setup',
      fields: ['members'],
    },
    {
      title: 'Settings',
      fields: ['settings'],
    },
  ];

  const canProceed = () => {
    const currentFields = steps[currentStep].fields;
    // Validate only current step fields
    return form.state.fieldMeta.some(field => 
      currentFields.includes(field.name) && field.errors.length === 0
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`flex items-center ${
              index < currentStep ? 'text-green-600' : 
              index === currentStep ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <div className={`
              w-8 h-8 rounded-full border-2 flex items-center justify-center
              ${index <= currentStep ? 'border-current bg-current text-white' : 'border-current'}
            `}>
              {index < currentStep ? '✓' : index + 1}
            </div>
            <span className="ml-2 hidden sm:inline">{step.title}</span>
          </div>
        ))}
      </div>

      {/* Form Content */}
      <form onSubmit={form.handleSubmit}>
        {currentStep === 0 && <OrganizationDetailsStep form={form} />}
        {currentStep === 1 && <TeamSetupStep form={form} />}
        {currentStep === 2 && <SettingsStep form={form} />}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            Previous
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button
              type="button"
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
            >
              Next
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={!form.state.canSubmit || form.state.isSubmitting}
            >
              {form.state.isSubmitting ? 'Creating...' : 'Create Organization'}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
```

## Integration with TanStack Query

```typescript
export function EditOrganizationForm({ organizationId }: { organizationId: string }) {
  const { data: organization, isLoading } = useOrganization(organizationId);
  const updateOrganization = useUpdateOrganization();

  const form = useForm({
    defaultValues: {
      name: '',
      slug: '',
      description: '',
    },
    onSubmit: async ({ value }) => {
      await updateOrganization.mutateAsync({
        id: organizationId,
        ...value,
      });
    },
  });

  // Update form when data loads
  useEffect(() => {
    if (organization) {
      form.setValues({
        name: organization.name,
        slug: organization.slug,
        description: organization.description || '',
      });
    }
  }, [organization, form]);

  if (isLoading) return <FormSkeleton />;

  return <FormComponent form={form} />;
}
```

## Best Practices

### 1. Validation Strategy
- Use schema validation with Zod for type safety
- Implement async validation for server-side checks
- Debounce async validation to reduce API calls
- Provide clear, actionable error messages

### 2. Performance Optimization
- Use granular reactivity to minimize re-renders
- Implement field-level validation when appropriate
- Memoize expensive validation functions
- Use controlled vs uncontrolled inputs strategically

### 3. User Experience
- Show loading states during submission
- Implement auto-save for long forms
- Provide progress indicators for multi-step forms
- Handle network errors gracefully

### 4. Accessibility
- Associate labels with form controls
- Use proper ARIA attributes
- Implement keyboard navigation
- Provide screen reader support

### 5. Testing
- Test form validation logic
- Mock async operations in tests
- Test form submission flows
- Verify error handling scenarios

This reference should be used as the standard for all form implementations in the project.