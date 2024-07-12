<div class="colCenterContainer">
    @if (session()->has('error'))
        <div class="rowCenterContainer">
            <span class="normalTextError text-center">{{ session()->get('error') }}</span>
        </div>
    @endif

    @if (session()->has('success'))
        <div class="rowCenterContainer">
            <span class="normalTextValid text-center">{{ session()->get('success') }}</span>
        </div>
    @endif
</div>
