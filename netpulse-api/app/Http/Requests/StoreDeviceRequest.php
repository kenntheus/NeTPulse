<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDeviceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'ip_address' => ['required', 'ip'],
            'type' => ['required', 'in:router,switch,server,firewall,ap,phone,tablet,laptop,pc,cctv,printer,smarttv,other'],
            'location' => ['nullable', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'ip_address.ip' => 'Please enter a valid IPv4 or IPv6 address.',
        ];
    }
}
