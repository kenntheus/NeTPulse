<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDeviceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:100'],
            'ip_address' => ['sometimes', 'ip'],
            'type' => ['sometimes', 'in:router,switch,server,firewall,ap,phone,tablet,laptop,pc,cctv,printer,smarttv,other'],
            'location' => ['nullable', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
